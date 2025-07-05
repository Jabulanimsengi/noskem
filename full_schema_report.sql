

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."account_type_enum" AS ENUM (
    'individual',
    'business'
);


ALTER TYPE "public"."account_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."badge_type" AS ENUM (
    'first_sale',
    'top_seller',
    'power_buyer',
    'quick_shipper'
);


ALTER TYPE "public"."badge_type" OWNER TO "postgres";


CREATE TYPE "public"."credit_transaction_type" AS ENUM (
    'purchase',
    'listing_fee',
    'purchase_fee',
    'refund',
    'admin_grant',
    'feature_fee'
);


ALTER TYPE "public"."credit_transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."item_condition" AS ENUM (
    'new',
    'like_new',
    'used_good',
    'used_fair'
);


ALTER TYPE "public"."item_condition" OWNER TO "postgres";


CREATE TYPE "public"."item_status" AS ENUM (
    'available',
    'sold',
    'pending_payment'
);


ALTER TYPE "public"."item_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending_payment',
    'payment_authorized',
    'inspection_pending',
    'completed',
    'cancelled',
    'disputed',
    'awaiting_collection',
    'in_warehouse',
    'inspection_passed',
    'inspection_failed',
    'out_for_delivery',
    'awaiting_assessment',
    'pending_admin_approval',
    'item_collected',
    'delivered'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'sale',
    'commission',
    'payout',
    'credit_purchase',
    'listing_fee',
    'purchase_fee'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'agent',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) RETURNS TABLE("id" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_item_id int; v_buyer_id uuid; v_seller_id uuid; v_offer_amount numeric; v_new_order_id int;
BEGIN
    SELECT item_id, buyer_id, seller_id, offer_amount INTO v_item_id, v_buyer_id, v_seller_id, v_offer_amount
    FROM public.offers WHERE public.offers.id = p_offer_id FOR UPDATE;

    IF NOT EXISTS (SELECT 1 FROM public.items WHERE public.items.id = v_item_id AND public.items.status = 'available') THEN
        RAISE EXCEPTION 'Item is no longer available.';
    END IF;

    UPDATE public.offers SET status = 'accepted' WHERE public.offers.id = p_offer_id;
    UPDATE public.items SET status = 'pending_payment' WHERE public.items.id = v_item_id;

    INSERT INTO public.orders (item_id, buyer_id, seller_id, final_amount, status)
    VALUES (v_item_id, v_buyer_id, v_seller_id, v_offer_amount, 'pending_payment')
    RETURNING public.orders.id INTO v_new_order_id;

    UPDATE public.offers SET order_id = v_new_order_id WHERE public.offers.id = p_offer_id;
    RETURN QUERY SELECT v_new_order_id;
END;
$$;


ALTER FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_adjust_credits"("p_user_id" "uuid", "p_amount_to_add" integer, "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    -- First, verify that the user performing this action is an admin.
    IF (SELECT get_user_role(v_admin_id)) <> 'admin' THEN
        RAISE EXCEPTION 'Only administrators can perform this action.';
    END IF;

    -- Update the target user's credit balance.
    UPDATE public.profiles
    SET credit_balance = credit_balance + p_amount_to_add
    WHERE id = p_user_id;

    -- Log the transaction for auditing purposes.
    INSERT INTO public.credit_transactions(profile_id, amount, description, transaction_type)
    VALUES (p_user_id, p_amount_to_add, 'Admin Grant: ' || p_reason, 'admin_grant');

END;
$$;


ALTER FUNCTION "public"."admin_adjust_credits"("p_user_id" "uuid", "p_amount_to_add" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agent_accept_task"("p_order_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_agent_id UUID := auth.uid();
    v_order RECORD;
BEGIN
    -- First, check if the user performing this action is an agent.
    IF (SELECT get_user_role(v_agent_id)) <> 'agent' THEN
        RAISE EXCEPTION 'Only agents can perform this action.';
    END IF;

    -- Lock the order row to prevent other agents from accepting it at the same time.
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    -- Check if another agent has already accepted this task.
    IF v_order.agent_id IS NOT NULL THEN
        RAISE EXCEPTION 'This task has already been accepted by another agent.';
    END IF;

    -- Check if the task is in the correct state to be accepted.
    IF v_order.status <> 'payment_authorized' THEN
        RAISE EXCEPTION 'This task is not in a state to be accepted.';
    END IF;

    -- If all checks pass, assign the agent and update the status.
    UPDATE public.orders
    SET
        agent_id = v_agent_id,
        status = 'awaiting_assessment' -- As per your actions.ts file
    WHERE id = p_order_id;

    -- Notify the seller that an agent is on the way.
    PERFORM create_new_notification(
        v_order.seller_id,
        'An agent has been assigned to your item: "' || (SELECT title FROM items WHERE id = v_order.item_id) || '".',
        '/account/dashboard/orders'
    );
END;
$$;


ALTER FUNCTION "public"."agent_accept_task"("p_order_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agent_submit_inspection"("p_order_id" bigint, "p_photos" "text"[], "p_condition_matches" boolean, "p_condition_notes" "text", "p_functionality_matches" boolean, "p_functionality_notes" "text", "p_accessories_matches" boolean, "p_accessories_notes" "text", "p_final_verdict" "text", "p_verdict_notes" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_agent_id UUID := auth.uid();
    v_item_title TEXT;
    admin_profile RECORD;
BEGIN
    -- First, verify the agent is assigned to this order.
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND agent_id = v_agent_id) THEN
        RAISE EXCEPTION 'You are not assigned to this inspection task.';
    END IF;

    -- Insert the inspection report.
    INSERT INTO public.inspections (
        order_id, agent_id, photos, condition_matches, condition_notes,
        functionality_matches, functionality_notes, accessories_matches, accessories_notes,
        final_verdict, verdict_notes, status
    ) VALUES (
        p_order_id, v_agent_id, p_photos, p_condition_matches, p_condition_notes,
        p_functionality_matches, p_functionality_notes, p_accessories_matches, p_accessories_notes,
        p_final_verdict, p_verdict_notes, 'pending_admin_approval'
    );

    -- Update the order status.
    UPDATE public.orders
    SET status = 'pending_admin_approval'
    WHERE id = p_order_id;

    -- Get the item title for the notification.
    SELECT title INTO v_item_title FROM public.items WHERE id = (SELECT item_id FROM public.orders WHERE id = p_order_id);

    -- Notify all admins that a report is ready for review.
    FOR admin_profile IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        PERFORM create_new_notification(
            admin_profile.id,
            'An inspection report for "' || v_item_title || '" is ready for your review.',
            '/admin/inspections'
        );
    END LOOP;

END;
$$;


ALTER FUNCTION "public"."agent_submit_inspection"("p_order_id" bigint, "p_photos" "text"[], "p_condition_matches" boolean, "p_condition_notes" "text", "p_functionality_matches" boolean, "p_functionality_notes" "text", "p_accessories_matches" boolean, "p_accessories_notes" "text", "p_final_verdict" "text", "p_verdict_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_badge_if_not_exists"("p_user_id" "uuid", "p_badge_type" "public"."badge_type") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.user_badges (user_id, badge_type) VALUES (p_user_id, p_badge_type) ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."award_badge_if_not_exists"("p_user_id" "uuid", "p_badge_type" "public"."badge_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_bulk_notifications_securely"("notifications_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    notification_item JSONB;
BEGIN
    -- This function loops through a JSON array of notification objects
    -- and calls the single, secure function for each one.
    FOR notification_item IN SELECT * FROM jsonb_array_elements(notifications_data)
    LOOP
        PERFORM public.create_single_notification(
            (notification_item->>'profile_id')::uuid,
            notification_item->>'message',
            notification_item->>'link_url'
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_bulk_notifications_securely"("notifications_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_single_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- This function runs with the permissions of its owner (postgres)
  -- and can safely create a notification for any user.
  INSERT INTO public.notifications(profile_id, message, link_url)
  VALUES (p_profile_id, p_message, p_link_url);
END;
$$;


ALTER FUNCTION "public"."create_single_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "item_id" bigint NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "final_amount" numeric(10,2) NOT NULL,
    "paystack_ref" "text",
    "status" "public"."order_status" DEFAULT 'pending_payment'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "created_from_offer_id" integer,
    "inspection_fee_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "collection_fee_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "delivery_fee_paid" numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) RETURNS SETOF "public"."orders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD; v_seller_id UUID; v_payout_amount NUMERIC; v_commission_rate NUMERIC;
BEGIN
    SELECT "COMMISSION_RATE" INTO v_commission_rate FROM public.constants LIMIT 1;
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.status != 'completed' THEN
        RAISE EXCEPTION 'Payout can only be processed for completed orders.';
    END IF;

    v_seller_id := v_order.seller_id;
    v_payout_amount := v_order.final_amount * (1 - v_commission_rate);

    UPDATE public.profiles SET credit_balance = credit_balance + v_payout_amount WHERE id = v_seller_id;

    INSERT INTO public.financial_transactions (order_id, user_id, type, status, amount, description)
    VALUES (p_order_id, v_seller_id, 'payout', 'completed', v_payout_amount, 'Seller payout for order #' || p_order_id);

    UPDATE public.financial_transactions SET status = 'completed' WHERE order_id = p_order_id AND type = 'sale';

    -- Note: 'funds_paid_out' is not in the order_status ENUM. A different status or logic might be needed here.
    -- For now, we will not change the status to an invalid one.

    RETURN QUERY SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$;


ALTER FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" bigint NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "images" "jsonb"[],
    "category" "text",
    "condition" "public"."item_condition" NOT NULL,
    "buy_now_price" numeric(10,2),
    "status" "public"."item_status" DEFAULT 'available'::"public"."item_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" bigint,
    "view_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "latitude" double precision,
    "longitude" double precision,
    "location_description" "text",
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "description"))) STORED,
    "discount_percentage" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0,
    "new_item_price" numeric(10,2),
    "purchase_date" "date"
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_items_nearby"("lat" double precision, "long" double precision, "radius_km" double precision) RETURNS SETOF "public"."items"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.items WHERE status = 'available' AND ST_DWithin(ST_MakePoint(longitude, latitude)::geography, ST_MakePoint(long, lat)::geography, radius_km * 1000);
END;
$$;


ALTER FUNCTION "public"."get_items_nearby"("lat" double precision, "long" double precision, "radius_km" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_popular_items"("p_limit" integer DEFAULT 10) RETURNS SETOF "public"."items"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.items
    WHERE status = 'available'
    ORDER BY likes_count DESC, view_count DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_popular_items"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recently_listed_items"("p_limit" integer DEFAULT 10) RETURNS SETOF "public"."items"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.items
    WHERE status = 'available'
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recently_listed_items"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recently_sold_items"("p_limit" integer DEFAULT 10) RETURNS SETOF "public"."items"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.items
    WHERE status = 'sold'
    ORDER BY updated_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recently_sold_items"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") RETURNS TABLE("room_id" "text", "last_message" "text", "last_message_at" timestamp with time zone, "is_last_message_read" boolean, "other_user" json, "item" json)
    LANGUAGE "sql"
    AS $$ SELECT DISTINCT ON (m.room_id) m.room_id, m.message AS last_message, m.created_at AS last_message_at, (m.sender_id = p_user_id OR m.is_read = TRUE) AS is_last_message_read, json_build_object('id', p.id, 'username', p.username, 'avatar_url', p.avatar_url) AS other_user, (SELECT json_build_object('title', i.title) FROM items i WHERE i.id = (substring(m.room_id from 'chat_item_(\d+)_buyer_')::integer) LIMIT 1) AS item FROM chat_messages m JOIN profiles p ON p.id = (CASE WHEN m.sender_id = p_user_id THEN m.recipient_id ELSE m.sender_id END) WHERE m.sender_id = p_user_id OR m.recipient_id = p_user_id ORDER BY m.room_id, m.created_at DESC; $$;


ALTER FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = p_user_id);
END;
$$;


ALTER FUNCTION "public"."get_user_role"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_credit_purchase"("p_user_id" "uuid", "p_package_id" bigint, "p_paystack_ref" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_credit_package RECORD;
    v_total_credits_to_add INT;
    v_profile_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;
    IF NOT v_profile_exists THEN
        RAISE EXCEPTION 'User profile not found. Please complete your profile before purchasing credits.';
    END IF;

    SELECT * INTO v_credit_package FROM public.credit_packages WHERE id = p_package_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Credit package with ID % not found.', p_package_id;
    END IF;

    v_total_credits_to_add := v_credit_package.credits_amount + COALESCE(v_credit_package.bonus_credits, 0);

    UPDATE public.profiles SET credit_balance = credit_balance + v_total_credits_to_add WHERE id = p_user_id;
    INSERT INTO public.credit_transactions(profile_id, amount, description, transaction_type) VALUES (p_user_id, v_total_credits_to_add, 'Purchased ' || v_credit_package.name || ' package', 'purchase');
    INSERT INTO public.financial_transactions(user_id, type, status, amount, description) VALUES (p_user_id, 'credit_purchase', 'completed', v_credit_package.price_zar, 'Purchase of ' || v_credit_package.name || ' package via Paystack: ' || p_paystack_ref);
END;
$$;


ALTER FUNCTION "public"."handle_credit_purchase"("p_user_id" "uuid", "p_package_id" bigint, "p_paystack_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_item_purchase"("p_buyer_id" "uuid", "p_item_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_purchase_fee INT;
    v_current_balance INT;
    v_item RECORD;
    v_new_order_id BIGINT;
    v_has_pending_order BOOLEAN;
BEGIN
    -- Check if the user already has an item with 'pending_payment' status
    SELECT EXISTS (
        SELECT 1
        FROM public.orders
        WHERE buyer_id = p_buyer_id AND status = 'pending_payment'
    ) INTO v_has_pending_order;

    IF v_has_pending_order THEN
        RAISE EXCEPTION 'You already have an item pending payment. Please complete or cancel that transaction first.';
    END IF;

    -- Proceed with the original logic if no pending order exists
    SELECT "PURCHASE_FEE" INTO v_purchase_fee FROM public.constants LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'Purchase fee not configured in constants table.'; END IF;

    SELECT * INTO v_item FROM public.items WHERE id = p_item_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item not found.'; END IF;
    IF v_item.status <> 'available' THEN RAISE EXCEPTION 'This item is no longer available for purchase.'; END IF;

    SELECT credit_balance INTO v_current_balance FROM public.profiles WHERE id = p_buyer_id FOR UPDATE;
    IF v_current_balance < v_purchase_fee THEN RAISE EXCEPTION 'Insufficient credits for the purchase fee.'; END IF;

    UPDATE public.profiles SET credit_balance = credit_balance - v_purchase_fee WHERE id = p_buyer_id;
    INSERT INTO public.credit_transactions(profile_id, amount, description, transaction_type) VALUES (p_buyer_id, -v_purchase_fee, 'Purchase fee for item: ' || v_item.title, 'purchase_fee');
    INSERT INTO public.financial_transactions(user_id, type, status, amount, description) VALUES (p_buyer_id, 'purchase_fee', 'completed', -v_purchase_fee, 'Purchase Fee for: ' || v_item.title);
    UPDATE public.items SET status = 'pending_payment' WHERE id = p_item_id;
    INSERT INTO public.orders(item_id, buyer_id, seller_id, final_amount, status) VALUES (p_item_id, p_buyer_id, v_item.seller_id, v_item.buy_now_price, 'pending_payment') RETURNING id INTO v_new_order_id;
    
    RETURN v_new_order_id;
END;
$$;


ALTER FUNCTION "public"."handle_item_purchase"("p_buyer_id" "uuid", "p_item_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_item_listing"("p_seller_id" "uuid", "p_title" "text", "p_description" "text", "p_category_id" bigint, "p_condition" "public"."item_condition", "p_buy_now_price" numeric, "p_images" "jsonb"[], "p_latitude" double precision, "p_longitude" double precision, "p_location_description" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_listing_fee INT; v_current_balance INT; v_new_item_id BIGINT;
BEGIN
    SELECT "LISTING_FEE" INTO v_listing_fee FROM public.constants LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'Listing fee not configured in constants table.'; END IF;

    SELECT credit_balance INTO v_current_balance FROM public.profiles WHERE id = p_seller_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found for this user.'; END IF;
    IF v_current_balance < v_listing_fee THEN RAISE EXCEPTION 'Insufficient credits to post a new listing.'; END IF;

    UPDATE public.profiles SET credit_balance = credit_balance - v_listing_fee WHERE id = p_seller_id;
    INSERT INTO public.credit_transactions(profile_id, amount, description, transaction_type) VALUES (p_seller_id, -v_listing_fee, 'Fee for new item listing: ' || p_title, 'listing_fee');
    INSERT INTO public.financial_transactions(user_id, type, status, amount, description) VALUES (p_seller_id, 'listing_fee', 'completed', -v_listing_fee, 'Listing Fee for: ' || p_title);
    INSERT INTO public.items(seller_id, title, description, category_id, condition, buy_now_price, images, latitude, longitude, location_description)
    VALUES (p_seller_id, p_title, p_description, p_category_id, p_condition, p_buy_now_price, p_images, p_latitude, p_longitude, p_location_description)
    RETURNING id INTO v_new_item_id;
    RETURN v_new_item_id;
END;
$$;


ALTER FUNCTION "public"."handle_new_item_listing"("p_seller_id" "uuid", "p_title" "text", "p_description" "text", "p_category_id" bigint, "p_condition" "public"."item_condition", "p_buy_now_price" numeric, "p_images" "jsonb"[], "p_latitude" double precision, "p_longitude" double precision, "p_location_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, account_type, username, first_name, last_name, company_name, company_registration)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type_enum, 'individual'),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 4)),
    CASE WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'individual' THEN NEW.raw_user_meta_data->>'first_name' ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'individual' THEN NEW.raw_user_meta_data->>'last_name' ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'business' THEN NEW.raw_user_meta_data->>'company_name' ELSE NULL END,
    CASE WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'business' THEN NEW.raw_user_meta_data->>'company_registration' ELSE NULL END
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) RETURNS "void"
    LANGUAGE "sql"
    AS $$
  UPDATE public.items SET view_count = COALESCE(view_count, 0) + 1 WHERE id = item_id_to_increment;
$$;


ALTER FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_commission_amount NUMERIC;
    v_commission_rate NUMERIC;
    agent_profile RECORD; -- For looping through agents
BEGIN
    -- Get constants
    SELECT "COMMISSION_RATE" INTO v_commission_rate FROM public.constants LIMIT 1;

    -- Update order status
    UPDATE public.orders
    SET status = 'payment_authorized', paystack_ref = p_paystack_ref
    WHERE id = p_order_id AND buyer_id = p_buyer_id
    RETURNING * INTO v_order;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found or buyer not authorized.';
    END IF;

    -- Update item status
    UPDATE public.items
    SET status = 'sold'
    WHERE id = v_order.item_id
    RETURNING * INTO v_item;

    -- Notify Seller
    PERFORM create_new_notification(
        v_order.seller_id,
        'Your item "' || v_item.title || '" has been sold!',
        '/orders/' || v_order.id
    );

    -- FIX #2: Notify all Agents of the new task.
    FOR agent_profile IN SELECT id FROM public.profiles WHERE role = 'agent' LOOP
        PERFORM create_new_notification(
            agent_profile.id,
            'New task available: Item "' || v_item.title || '" needs inspection.',
            '/agent/dashboard'
        );
    END LOOP;

    -- Create financial transactions
    v_commission_amount := v_order.final_amount * v_commission_rate;

    -- Transactions for Seller (Sale and Commission)
    INSERT INTO public.financial_transactions (order_id, user_id, type, status, amount, description)
    VALUES
      (p_order_id, v_order.seller_id, 'sale', 'pending', v_order.final_amount, 'Sale of item: ' || v_item.title),
      (p_order_id, v_order.seller_id, 'commission', 'completed', -v_commission_amount, 'Commission for: ' || v_item.title);

    -- FIX #1: Transaction for Buyer (Item Purchase).
    -- This creates the missing record for the buyer's transaction history.
    INSERT INTO public.financial_transactions (order_id, user_id, type, status, amount, description)
    VALUES (p_order_id, p_buyer_id, 'sale', 'completed', -v_order.final_amount, 'Purchase of item: ' || v_item.title);

END;
$$;


ALTER FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_abandoned_orders"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_purchase_fee INT;
    abandoned_order RECORD;
BEGIN
    SELECT "PURCHASE_FEE" INTO v_purchase_fee FROM public.constants LIMIT 1;
    IF v_purchase_fee IS NULL THEN
        RAISE NOTICE 'Purchase fee not configured, skipping fee refunds.';
        v_purchase_fee := 0;
    END IF;

    FOR abandoned_order IN
        SELECT o.id, o.buyer_id, o.item_id, i.title as item_title
        FROM public.orders o
        JOIN public.items i ON o.item_id = i.id
        WHERE o.status = 'pending_payment' AND o.created_at < now() - interval '5 minutes'
    LOOP
        UPDATE public.profiles SET credit_balance = credit_balance + v_purchase_fee WHERE id = abandoned_order.buyer_id;
        INSERT INTO public.credit_transactions(profile_id, amount, description, transaction_type) VALUES (abandoned_order.buyer_id, v_purchase_fee, 'Refund for expired order #' || abandoned_order.id, 'refund');
        INSERT INTO public.financial_transactions(user_id, type, status, amount, description, order_id) VALUES (abandoned_order.buyer_id, 'refund', 'completed', v_purchase_fee, 'Refund of Purchase Fee for expired order on: ' || abandoned_order.item_title, abandoned_order.id);
        UPDATE public.items SET status = 'available' WHERE id = abandoned_order.item_id;
        UPDATE public.orders SET status = 'cancelled' WHERE id = abandoned_order.id;
        RAISE NOTICE 'Reverted abandoned order #%', abandoned_order.id;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."revert_abandoned_orders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_chat_message"("p_recipient_id" "uuid", "p_message_text" "text", "p_room_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_sender_id UUID := auth.uid();
BEGIN
    -- This function runs with the permissions of the user calling it.
    -- The RLS policy on the table will still be checked, but since we are
    -- setting sender_id = auth.uid() here, the check will pass.
    INSERT INTO public.chat_messages (sender_id, recipient_id, message, room_id)
    VALUES (v_sender_id, p_recipient_id, p_message_text, p_room_id);
END;
$$;


ALTER FUNCTION "public"."send_chat_message"("p_recipient_id" "uuid", "p_message_text" "text", "p_room_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.items SET likes_count = likes_count + 1 WHERE id = NEW.item_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.items SET likes_count = likes_count - 1 WHERE id = OLD.item_id;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seller_average_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN UPDATE public.profiles SET average_rating = (SELECT AVG(rating) FROM public.reviews WHERE seller_id = NEW.seller_id) WHERE id = NEW.seller_id; RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_seller_average_rating"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" bigint NOT NULL,
    "room_id" "text" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "image_urls" "text"[],
    "is_read" boolean DEFAULT false
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


ALTER TABLE "public"."chat_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."constants" (
    "id" integer NOT NULL,
    "COMMISSION_RATE" numeric(3,2) NOT NULL,
    "PURCHASE_FEE" integer NOT NULL,
    "LISTING_FEE" integer NOT NULL,
    "FEATURE_FEE" integer NOT NULL
);


ALTER TABLE "public"."constants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_packages" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "credits_amount" integer NOT NULL,
    "price_zar" numeric(10,2) NOT NULL,
    "bonus_credits" integer DEFAULT 0,
    "features" "text"[],
    "is_popular" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."credit_packages" OWNER TO "postgres";


ALTER TABLE "public"."credit_packages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."credit_packages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "transaction_type" "public"."credit_transaction_type"
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


ALTER TABLE "public"."credit_transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."credit_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."dispute_messages" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "image_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dispute_messages" OWNER TO "postgres";


ALTER TABLE "public"."dispute_messages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."dispute_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."financial_transactions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" bigint,
    "type" "public"."transaction_type" NOT NULL,
    "status" "public"."transaction_status" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."financial_transactions" OWNER TO "postgres";


ALTER TABLE "public"."financial_transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."financial_transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inspection_reports" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "report_text" "text",
    "image_urls" "text"[],
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."inspection_reports" OWNER TO "postgres";


ALTER TABLE "public"."inspection_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."inspection_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inspections" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "photos" "text"[],
    "condition_matches" boolean,
    "condition_notes" "text",
    "functionality_matches" boolean,
    "functionality_notes" "text",
    "accessories_matches" boolean,
    "accessories_notes" "text",
    "final_verdict" "text" NOT NULL,
    "verdict_notes" "text" NOT NULL,
    "status" "text" DEFAULT 'pending_admin_approval'::"text",
    "admin_status" "text"
);


ALTER TABLE "public"."inspections" OWNER TO "postgres";


ALTER TABLE "public"."inspections" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."inspections_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."likes" (
    "user_id" "uuid" NOT NULL,
    "item_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "link_url" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" bigint NOT NULL,
    "item_id" bigint NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "offer_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending_seller_review'::"text" NOT NULL,
    "last_offer_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_id" integer
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


ALTER TABLE "public"."offers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."offers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."order_history" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_history" OWNER TO "postgres";


ALTER TABLE "public"."order_history" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."order_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."orders" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "address" "text",
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "account_type" "public"."account_type_enum" DEFAULT 'individual'::"public"."account_type_enum" NOT NULL,
    "company_name" "text",
    "company_registration" "text",
    "credit_balance" integer DEFAULT 0 NOT NULL,
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "average_rating" numeric(2,1) DEFAULT 0.0,
    "availability_notes" "text",
    "verification_status" "text" DEFAULT 'not_verified'::"text",
    "verification_documents" "jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "order_id" bigint NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


ALTER TABLE "public"."reviews" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."saved_searches" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "search_query" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_searches" OWNER TO "postgres";


ALTER TABLE "public"."saved_searches" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."saved_searches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "user_id" "uuid" NOT NULL,
    "badge_type" "public"."badge_type" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."constants"
    ADD CONSTRAINT "constants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_packages"
    ADD CONSTRAINT "credit_packages_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."credit_packages"
    ADD CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispute_messages"
    ADD CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_reports"
    ADD CONSTRAINT "inspection_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("user_id", "item_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_history"
    ADD CONSTRAINT "order_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_paystack_ref_key" UNIQUE ("paystack_ref");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_user_id_search_query_key" UNIQUE ("user_id", "search_query");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id", "badge_type");



CREATE INDEX "idx_dispute_messages_order_id" ON "public"."dispute_messages" USING "btree" ("order_id");



CREATE OR REPLACE TRIGGER "on_items_update" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_like_change" AFTER INSERT OR DELETE ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_likes_count"();



CREATE OR REPLACE TRIGGER "on_review_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_seller_average_rating"();



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."dispute_messages"
    ADD CONSTRAINT "dispute_messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dispute_messages"
    ADD CONSTRAINT "dispute_messages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."inspection_reports"
    ADD CONSTRAINT "inspection_reports_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."inspection_reports"
    ADD CONSTRAINT "inspection_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."inspections"
    ADD CONSTRAINT "inspections_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."order_history"
    ADD CONSTRAINT "order_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."order_history"
    ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_created_from_offer_id_fkey" FOREIGN KEY ("created_from_offer_id") REFERENCES "public"."offers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."saved_searches"
    ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and assigned agents can manage inspection reports" ON "public"."inspection_reports" USING ((("public"."get_user_role"("auth"."uid"()) = 'admin'::"text") OR ("auth"."uid"() = "agent_id")));



CREATE POLICY "Admins and involved parties can view dispute messages" ON "public"."dispute_messages" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "dispute_messages"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Admins and involved users can view order history" ON "public"."order_history" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_history"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Admins can delete orders" ON "public"."orders" FOR DELETE USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can update inspection reports" ON "public"."inspections" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text")) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Admins can view all dispute messages" ON "public"."dispute_messages" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"text"));



CREATE POLICY "Agents can create reports for their assigned orders" ON "public"."inspections" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "agent_id") AND (EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "inspections"."order_id") AND ("orders"."agent_id" = "auth"."uid"()))))));



CREATE POLICY "Comprehensive Order Update Policy" ON "public"."orders" FOR UPDATE USING ((("auth"."uid"() = "agent_id") OR (("public"."get_user_role"("auth"."uid"()) = 'agent'::"text") AND ("status" = 'payment_authorized'::"public"."order_status"))));



CREATE POLICY "Comprehensive Order View Policy" ON "public"."orders" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'admin'::"text") OR ("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id") OR ("auth"."uid"() = "agent_id") OR (("public"."get_user_role"("auth"."uid"()) = 'agent'::"text") AND ("status" = 'payment_authorized'::"public"."order_status"))));



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Involved parties can create dispute messages" ON "public"."dispute_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "dispute_messages"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"())) AND ("dispute_messages"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Involved parties can view inspection reports" ON "public"."inspections" FOR SELECT USING ((("public"."get_user_role"("auth"."uid"()) = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "inspections"."order_id") AND (("orders"."agent_id" = "auth"."uid"()) OR ("orders"."buyer_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Parties involved can create dispute messages" ON "public"."dispute_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "dispute_messages"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"())) AND ("dispute_messages"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Parties involved can view their dispute messages" ON "public"."dispute_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "dispute_messages"."order_id") AND (("orders"."buyer_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"()))))));



CREATE POLICY "Public can view categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public can view constants" ON "public"."constants" FOR SELECT USING (true);



CREATE POLICY "Public can view credit packages" ON "public"."credit_packages" FOR SELECT USING (true);



CREATE POLICY "Public can view profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public can view published items" ON "public"."items" FOR SELECT USING (("status" = ANY (ARRAY['available'::"public"."item_status", 'sold'::"public"."item_status", 'pending_payment'::"public"."item_status"])));



CREATE POLICY "Public categories are viewable by everyone." ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public constants are viewable by everyone" ON "public"."constants" FOR SELECT USING (true);



CREATE POLICY "Sellers can manage their own items" ON "public"."items" TO "authenticated" USING (("auth"."uid"() = "seller_id")) WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can create orders" ON "public"."orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can manage their own chat messages" ON "public"."chat_messages" USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "recipient_id"))) WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can manage their own credit transactions" ON "public"."credit_transactions" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can manage their own financial transactions" ON "public"."financial_transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own likes" ON "public"."likes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own orders, Admins can manage all" ON "public"."orders" USING ((("public"."get_user_role"("auth"."uid"()) = 'admin'::"text") OR ("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id") OR ("auth"."uid"() = "agent_id")));



CREATE POLICY "Users can manage their own saved searches" ON "public"."saved_searches" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages" ON "public"."chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own chat messages" ON "public"."chat_messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dispute_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_searches" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "authenticator";














































































































































































GRANT ALL ON FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."admin_adjust_credits"("p_user_id" "uuid", "p_amount_to_add" integer, "p_reason" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."agent_accept_task"("p_order_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."agent_submit_inspection"("p_order_id" bigint, "p_photos" "text"[], "p_condition_matches" boolean, "p_condition_notes" "text", "p_functionality_matches" boolean, "p_functionality_notes" "text", "p_accessories_matches" boolean, "p_accessories_notes" "text", "p_final_verdict" "text", "p_verdict_notes" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."award_badge_if_not_exists"("p_user_id" "uuid", "p_badge_type" "public"."badge_type") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_bulk_notifications_securely"("notifications_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_single_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") TO "authenticated";



GRANT ALL ON TABLE "public"."orders" TO "authenticated";



GRANT ALL ON FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) TO "authenticated";



GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT SELECT ON TABLE "public"."items" TO "anon";



GRANT ALL ON FUNCTION "public"."get_items_nearby"("lat" double precision, "long" double precision, "radius_km" double precision) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_popular_items"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_items"("p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_recently_listed_items"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recently_listed_items"("p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_recently_sold_items"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recently_sold_items"("p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."handle_credit_purchase"("p_user_id" "uuid", "p_package_id" bigint, "p_paystack_ref" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."handle_item_purchase"("p_buyer_id" "uuid", "p_item_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."handle_new_item_listing"("p_seller_id" "uuid", "p_title" "text", "p_description" "text", "p_category_id" bigint, "p_condition" "public"."item_condition", "p_buy_now_price" numeric, "p_images" "jsonb"[], "p_latitude" double precision, "p_longitude" double precision, "p_location_description" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."revert_abandoned_orders"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."send_chat_message"("p_recipient_id" "uuid", "p_message_text" "text", "p_room_id" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_likes_count"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_seller_average_rating"() TO "authenticated";
























GRANT SELECT ON TABLE "public"."categories" TO "anon";
GRANT SELECT ON TABLE "public"."categories" TO "authenticated";



GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";



GRANT SELECT ON TABLE "public"."constants" TO "anon";
GRANT SELECT ON TABLE "public"."constants" TO "authenticated";



GRANT SELECT ON TABLE "public"."credit_packages" TO "anon";
GRANT SELECT ON TABLE "public"."credit_packages" TO "authenticated";



GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";



GRANT ALL ON TABLE "public"."dispute_messages" TO "authenticated";



GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";



GRANT ALL ON TABLE "public"."inspection_reports" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."inspections" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."likes" TO "authenticator";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";



GRANT ALL ON TABLE "public"."notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."offers" TO "authenticated";



GRANT ALL ON TABLE "public"."order_history" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."profiles" TO "authenticator";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "anon";



GRANT ALL ON TABLE "public"."reviews" TO "authenticated";



GRANT ALL ON TABLE "public"."saved_searches" TO "authenticated";



GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";

































RESET ALL;

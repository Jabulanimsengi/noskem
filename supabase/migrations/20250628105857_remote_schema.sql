

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."account_type_enum" AS ENUM (
    'individual',
    'business'
);


ALTER TYPE "public"."account_type_enum" OWNER TO "postgres";


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
    v_item_id int;
    v_buyer_id uuid;
    v_seller_id uuid;
    v_offer_amount numeric;
    v_new_order_id int;
BEGIN
    -- 1. Get offer details and lock the row to prevent race conditions
    SELECT
        item_id, buyer_id, seller_id, offer_amount
    INTO
        v_item_id, v_buyer_id, v_seller_id, v_offer_amount
    FROM
        public.offers
    WHERE
        public.offers.id = p_offer_id
    FOR UPDATE;

    -- 2. Check if the item is still available
    IF NOT EXISTS (SELECT 1 FROM public.items WHERE public.items.id = v_item_id AND public.items.status = 'available') THEN
        RAISE EXCEPTION 'Item is no longer available.';
    END IF;

    -- 3. Update the offer status to 'accepted'
    UPDATE public.offers
    SET status = 'accepted'
    WHERE public.offers.id = p_offer_id;

    -- 4. Update the item status to 'pending_payment'
    -- This will now succeed because the function has elevated permissions.
    UPDATE public.items
    SET status = 'pending_payment'
    WHERE public.items.id = v_item_id;

    -- 5. Create a new order
    INSERT INTO public.orders (item_id, buyer_id, seller_id, final_amount, status)
    VALUES (v_item_id, v_buyer_id, v_seller_id, v_offer_amount, 'pending_payment')
    RETURNING public.orders.id INTO v_new_order_id;
    
    -- 6. Link the new order_id back to the offer for reference
    UPDATE public.offers
    SET order_id = v_new_order_id
    WHERE public.offers.id = p_offer_id;

    -- 7. Return the new order's ID
    RETURN QUERY SELECT v_new_order_id;
END;
$$;


ALTER FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_credits_to_user"("user_id" "uuid", "amount_to_add" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET credit_balance = credit_balance + amount_to_add
  WHERE id = user_id;
END;
$$;


ALTER FUNCTION "public"."add_credits_to_user"("user_id" "uuid", "amount_to_add" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_user_credits"("p_user_id" "uuid", "p_amount_to_adjust" integer, "p_admin_notes" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_balance INT;
BEGIN
    -- Get the current balance and lock the row for the transaction
    SELECT credit_balance INTO current_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;

    -- Ensure the adjustment does not result in a negative balance
    IF (current_balance + p_amount_to_adjust) < 0 THEN
        RAISE EXCEPTION 'Credit adjustment would result in a negative balance.';
    END IF;

    -- Update the user's credit balance
    UPDATE public.profiles
    SET credit_balance = credit_balance + p_amount_to_adjust
    WHERE id = p_user_id;

    -- Log the administrative transaction for record-keeping
    INSERT INTO public.credit_transactions(profile_id, amount, description)
    VALUES(p_user_id, p_amount_to_adjust, 'Admin adjustment: ' || p_admin_notes);

END;
$$;


ALTER FUNCTION "public"."adjust_user_credits"("p_user_id" "uuid", "p_amount_to_adjust" integer, "p_admin_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_new_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notifications(profile_id, message, link_url)
  VALUES (p_profile_id, p_message, p_link_url);
END;
$$;


ALTER FUNCTION "public"."create_new_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_listing_fee"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    -- The fee is set to 25, matching the value in the app.
    fee_amount int := 25;
    current_balance int;
BEGIN
    -- Get the user's current credit balance and lock the row for the transaction.
    SELECT credit_balance INTO current_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;

    -- Check if the user has enough credits.
    IF current_balance < fee_amount THEN
        -- If not enough credits, return false to indicate failure.
        RETURN FALSE;
    END IF;

    -- If credits are sufficient, deduct the fee.
    UPDATE public.profiles
    SET credit_balance = credit_balance - fee_amount
    WHERE id = p_user_id;

    -- Return true to indicate the transaction was successful.
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."deduct_listing_fee"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_purchase_fee"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_purchase_fee INT;
    v_user_credits INT;
BEGIN
    -- Get the purchase fee from the constants table
    SELECT "PURCHASE_FEE" INTO v_purchase_fee FROM public.constants LIMIT 1;

    -- Add a check to ensure the fee value was actually found
    IF v_purchase_fee IS NULL THEN
        RAISE EXCEPTION 'Configuration error: PURCHASE_FEE not set in the constants table.';
    END IF;

    -- Get the user's current credit balance
    SELECT credit_balance INTO v_user_credits FROM public.profiles WHERE id = p_user_id;

    -- Check if the user has enough credits
    IF v_user_credits >= v_purchase_fee THEN
        -- If they do, deduct the fee
        UPDATE public.profiles
        SET credit_balance = credit_balance - v_purchase_fee
        WHERE id = p_user_id;
        
        -- And create a transaction record
        INSERT INTO public.credit_transactions (profile_id, amount, transaction_type, description)
        VALUES (p_user_id, -v_purchase_fee, 'purchase_fee', 'Fee for initiating item purchase.');
        
        RETURN TRUE; -- Success
    ELSE
        -- If they don't, do nothing and return false
        RETURN FALSE; -- Failure
    END IF;
END;
$$;


ALTER FUNCTION "public"."deduct_purchase_fee"("p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "item_id" bigint NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "final_amount" numeric(10,2) NOT NULL,
    "paystack_ref" "text",
    "status" "public"."order_status" DEFAULT 'pending_payment'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "agent_id" "uuid",
    "created_from_offer_id" integer,
    "inspection_fee_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "collection_fee_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "delivery_fee_paid" numeric(10,2) DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY "public"."orders" REPLICA IDENTITY FULL;


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'Manages the entire lifecycle of a purchase.';



COMMENT ON COLUMN "public"."orders"."paystack_ref" IS 'Unique transaction reference from Paystack.';



COMMENT ON COLUMN "public"."orders"."status" IS 'Tracks the state of the escrow payment.';



CREATE OR REPLACE FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) RETURNS SETOF "public"."orders"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD;
    v_seller_id UUID;
    v_payout_amount NUMERIC;
BEGIN
    -- 1. Find the completed order and lock it
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    -- 2. Validate the order status
    IF v_order.status != 'completed' THEN
        RAISE EXCEPTION 'Payout can only be processed for completed orders.';
    END IF;

    -- 3. Calculate payout amount (sale price - commission)
    v_seller_id := v_order.seller_id;
    v_payout_amount := v_order.final_amount * (1 - (SELECT "COMMISSION_RATE" FROM public.constants));

    -- 4. Add credits to seller's profile
    UPDATE public.profiles
    SET credit_balance = credit_balance + v_payout_amount
    WHERE id = v_seller_id;
    
    -- 5. Create a 'payout' transaction record
    INSERT INTO public.financial_transactions (order_id, user_id, type, status, amount, description)
    VALUES (p_order_id, v_seller_id, 'payout', 'completed', v_payout_amount, 'Seller payout for order #' || p_order_id);

    -- 6. Update the main 'sale' transaction record to 'completed'
    UPDATE public.financial_transactions
    SET status = 'completed'
    WHERE order_id = p_order_id AND type = 'sale';
    
    -- 7. Finally, update the order status to 'funds_paid_out'
    UPDATE public.orders
    SET status = 'funds_paid_out'
    WHERE id = p_order_id;

    -- Return the updated order details
    RETURN QUERY SELECT * FROM public.orders WHERE id = p_order_id;
END;
$$;


ALTER FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_analytics"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    daily_series timestamptz[];
    signups int[];
    listings int[];
    orders int[];
BEGIN
    -- 1. Create a series of the last 30 days
    SELECT array_agg(d) INTO daily_series FROM generate_series(
        date_trunc('day', now() - interval '29 days'),
        date_trunc('day', now()),
        '1 day'
    ) d;

    -- 2. Get counts for each day
    SELECT
        array_agg(COALESCE(s.count, 0)),
        array_agg(COALESCE(i.count, 0)),
        array_agg(COALESCE(o.count, 0))
    INTO
        signups,
        listings,
        orders
    FROM unnest(daily_series) d
    LEFT JOIN (
        -- This query will now succeed because of the GRANT statement above.
        SELECT date_trunc('day', created_at) as day, count(*) as count
        FROM auth.users GROUP BY 1
    ) s ON s.day = d
    LEFT JOIN (
        SELECT date_trunc('day', created_at) as day, count(*) as count
        FROM public.items GROUP BY 1
    ) i ON i.day = d
    LEFT JOIN (
        SELECT date_trunc('day', created_at) as day, count(*) as count
        FROM public.orders WHERE status = 'completed' GROUP BY 1
    ) o ON o.day = d;

    -- 3. Combine into a single JSON object
    RETURN json_build_object(
        'dates', daily_series,
        'signups', signups,
        'listings', listings,
        'orders', orders
    );
END;
$$;


ALTER FUNCTION "public"."get_dashboard_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") RETURNS TABLE("room_id" "text", "last_message" "text", "last_message_at" timestamp with time zone, "is_last_message_read" boolean, "other_user" json, "item" json)
    LANGUAGE "sql"
    AS $$
SELECT DISTINCT ON (m.room_id)
  m.room_id,
  m.message AS last_message,
  m.created_at AS last_message_at,
  (m.sender_id = p_user_id OR m.is_read = TRUE) AS is_last_message_read,
  json_build_object(
    'id', p.id,
    'username', p.username,
    'avatar_url', p.avatar_url
  ) AS other_user,
  (
    SELECT json_build_object('title', i.title)
    FROM items i
    WHERE i.id = (substring(m.room_id from 'chat_item_(\d+)_buyer_')::integer)
    LIMIT 1
  ) AS item
FROM
  chat_messages m
JOIN
  profiles p ON p.id = (CASE
    WHEN m.sender_id = p_user_id THEN m.recipient_id
    ELSE m.sender_id
  END)
WHERE
  m.sender_id = p_user_id OR m.recipient_id = p_user_id
ORDER BY
  m.room_id, m.created_at DESC;
$$;


ALTER FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE id = p_user_id
  );
END;
$$;


ALTER FUNCTION "public"."get_user_role"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_initial_credits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if the user is being confirmed for the first time
  -- The OLD record has email_confirmed_at as NULL, and the NEW one has a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Add 25 credits to the user's profile
    UPDATE public.profiles
    SET credit_balance = credit_balance + 25
    WHERE id = NEW.id;

    -- Log this transaction for their records
    INSERT INTO public.credit_transactions(profile_id, amount, description)
    VALUES(NEW.id, 25, 'Welcome bonus for confirming your email');
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."grant_initial_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert a new row into the public.profiles table, using the data from the new auth.users row.
  INSERT INTO public.profiles (
    id,
    account_type,
    username,
    first_name,
    last_name,
    company_name,
    company_registration
  )
  VALUES (
    NEW.id,
    -- Get account_type from metadata, default to 'individual' if not provided
    COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type_enum, 'individual'),
    
    -- Get username from metadata, or create a unique fallback
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      -- Use extensions.gen_random_uuid() to be explicit
      split_part(NEW.email, '@', 1) || '_' || substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 4)
    ),
    
    -- Use a CASE statement to safely handle conditional fields
    CASE
      WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'individual'
      THEN NEW.raw_user_meta_data->>'first_name'
      ELSE NULL
    END,

    CASE
      WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'individual'
      THEN NEW.raw_user_meta_data->>'last_name'
      ELSE NULL
    END,
    
    CASE
      WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'business'
      THEN NEW.raw_user_meta_data->>'company_name'
      ELSE NULL
    END,

    CASE
      WHEN (NEW.raw_user_meta_data->>'account_type')::text = 'business'
      THEN NEW.raw_user_meta_data->>'company_registration'
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) RETURNS "void"
    LANGUAGE "sql"
    AS $$
  UPDATE public.items
  -- COALESCE(view_count, 0) safely handles cases where the count is currently NULL, treating it as 0 before adding 1.
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = item_id_to_increment;
$$;


ALTER FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("item_id_to_increment" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.items
    SET view_count = view_count + 1
    WHERE id = item_id_to_increment;
END;
$$;


ALTER FUNCTION "public"."increment_view_count"("item_id_to_increment" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD;
    v_commission_amount NUMERIC;
BEGIN
    -- 1. Update the order status and lock the row
    UPDATE public.orders
    SET 
        status = 'payment_authorized',
        paystack_ref = p_paystack_ref
    WHERE id = p_order_id AND buyer_id = p_buyer_id
    RETURNING * INTO v_order;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found or buyer not authorized.';
    END IF;

    -- 2. Update the associated item's status to 'sold'
    UPDATE public.items
    SET status = 'sold'
    WHERE id = v_order.item_id;

    -- 3. Calculate commission and create financial transaction records
    v_commission_amount := v_order.final_amount * (SELECT "COMMISSION_RATE" FROM public.constants LIMIT 1);

    INSERT INTO public.financial_transactions (order_id, user_id, type, status, amount, description)
    VALUES 
      -- Record the full sale amount for the seller, pending payout.
      (p_order_id, v_order.seller_id, 'sale', 'pending', v_order.final_amount, 'Sale of item for order #' || p_order_id),
      -- Record the commission fee for Noskem. This is a negative amount for the seller.
      (p_order_id, v_order.seller_id, 'commission', 'completed', -v_commission_amount, '10% commission for order #' || p_order_id);

END;
$$;


ALTER FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_seller_average_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    avg_rating REAL;
BEGIN
    -- Calculate the new average rating for the specific seller who was reviewed.
    SELECT AVG(rating) INTO avg_rating
    FROM public.reviews
    WHERE seller_id = NEW.seller_id;

    -- Update the 'average_rating' column in the 'profiles' table for that seller.
    UPDATE public.profiles
    SET average_rating = avg_rating
    WHERE id = NEW.seller_id;

    RETURN NEW;
END;
$$;


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
    "is_read" boolean DEFAULT false,
    CONSTRAINT "chat_messages_message_check" CHECK (("char_length"("message") > 0))
);

ALTER TABLE ONLY "public"."chat_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."chat_messages" IS 'Stores all real-time chat messages between users.';



COMMENT ON COLUMN "public"."chat_messages"."room_id" IS 'A unique identifier for a chat between users about an item.';



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
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "is_popular" boolean DEFAULT false
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



CREATE TABLE IF NOT EXISTS "public"."financial_transactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" bigint,
    "type" "public"."transaction_type" NOT NULL,
    "status" "public"."transaction_status" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text"
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
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "admin_notes" "text"
);


ALTER TABLE "public"."inspection_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."inspection_reports" IS 'Stores inspection reports filed by agents for each order.';



ALTER TABLE "public"."inspection_reports" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."inspection_reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



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
    "category_id" bigint,
    "view_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "latitude" double precision,
    "longitude" double precision,
    "fts" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", (("title" || ' '::"text") || "description"))) STORED,
    "location_description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "items_buy_now_price_check" CHECK (("buy_now_price" > (0)::numeric)),
    CONSTRAINT "items_title_check" CHECK (("char_length"("title") > 3))
);

ALTER TABLE ONLY "public"."items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."items" OWNER TO "postgres";


COMMENT ON TABLE "public"."items" IS 'Contains all items listed for sale or auction.';



COMMENT ON COLUMN "public"."items"."seller_id" IS 'The user who is selling the item.';



COMMENT ON COLUMN "public"."items"."images" IS 'Array of image URLs from Supabase Storage.';



COMMENT ON COLUMN "public"."items"."buy_now_price" IS 'Price for immediate purchase. Can be null if it''s an auction-only item.';



ALTER TABLE "public"."items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "link_url" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);

ALTER TABLE ONLY "public"."notifications" REPLICA IDENTITY FULL;


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores notifications for users, such as order status updates.';



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
    "avatar_url" "text",
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "account_type" "public"."account_type_enum" DEFAULT 'individual'::"public"."account_type_enum" NOT NULL,
    "last_name" "text",
    "company_name" "text",
    "company_registration" "text",
    "credit_balance" integer DEFAULT 0 NOT NULL,
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "average_rating" numeric(2,1) DEFAULT 0.0,
    "address" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Stores public-facing user profile information.';



COMMENT ON COLUMN "public"."profiles"."id" IS 'Links to the authenticated user in auth.users.';



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_id" bigint NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
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



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inspection_reports"
    ADD CONSTRAINT "inspection_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "credit_transactions_profile_id_idx" ON "public"."credit_transactions" USING "btree" ("profile_id");



CREATE INDEX "financial_transactions_order_id_idx" ON "public"."financial_transactions" USING "btree" ("order_id");



CREATE INDEX "financial_transactions_user_id_idx" ON "public"."financial_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_chat_messages_recipient_id" ON "public"."chat_messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_chat_messages_room_id_created_at" ON "public"."chat_messages" USING "btree" ("room_id", "created_at" DESC);



CREATE INDEX "idx_chat_messages_sender_id" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_items_created_at" ON "public"."items" USING "btree" ("created_at");



CREATE INDEX "idx_items_is_featured" ON "public"."items" USING "btree" ("is_featured");



CREATE INDEX "idx_items_on_seller_id" ON "public"."items" USING "btree" ("seller_id");



CREATE INDEX "idx_items_status" ON "public"."items" USING "btree" ("status");



CREATE INDEX "idx_items_view_count" ON "public"."items" USING "btree" ("view_count");



CREATE INDEX "idx_orders_buyer_id" ON "public"."orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_orders_seller_id" ON "public"."orders" USING "btree" ("seller_id");



CREATE INDEX "inspection_reports_agent_id_idx" ON "public"."inspection_reports" USING "btree" ("agent_id");



CREATE INDEX "inspection_reports_order_id_idx" ON "public"."inspection_reports" USING "btree" ("order_id");



CREATE INDEX "items_category_id_idx" ON "public"."items" USING "btree" ("category_id");



CREATE INDEX "notifications_profile_id_idx" ON "public"."notifications" USING "btree" ("profile_id");



CREATE INDEX "offers_buyer_id_idx" ON "public"."offers" USING "btree" ("buyer_id");



CREATE INDEX "offers_item_id_idx" ON "public"."offers" USING "btree" ("item_id");



CREATE INDEX "offers_last_offer_by_idx" ON "public"."offers" USING "btree" ("last_offer_by");



CREATE INDEX "offers_order_id_idx" ON "public"."offers" USING "btree" ("order_id");



CREATE INDEX "offers_seller_id_idx" ON "public"."offers" USING "btree" ("seller_id");



CREATE INDEX "order_history_created_by_idx" ON "public"."order_history" USING "btree" ("created_by");



CREATE INDEX "orders_created_from_offer_id_idx" ON "public"."orders" USING "btree" ("created_from_offer_id");



CREATE INDEX "reviews_reviewer_id_idx" ON "public"."reviews" USING "btree" ("reviewer_id");



CREATE OR REPLACE TRIGGER "on_items_update" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_new_review_update_average_rating" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_seller_average_rating"();



CREATE OR REPLACE TRIGGER "on_review_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_seller_average_rating"();



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."inspection_reports"
    ADD CONSTRAINT "inspection_reports_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."inspection_reports"
    ADD CONSTRAINT "inspection_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_last_offer_by_fkey" FOREIGN KEY ("last_offer_by") REFERENCES "public"."profiles"("id");



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



CREATE POLICY "Admins can delete orders" ON "public"."orders" FOR DELETE USING ((( SELECT "public"."get_user_role"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_role") = 'admin'::"text"));



CREATE POLICY "Agents can create reports for assigned tasks" ON "public"."inspection_reports" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "agent_id"));



CREATE POLICY "Allow authenticated users to create their own transactions" ON "public"."financial_transactions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated users to read their own transactions" ON "public"."financial_transactions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Authenticated users can view items in their orders" ON "public"."items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."item_id" = "items"."id") AND (("orders"."buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("orders"."agent_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Available items are viewable by everyone." ON "public"."items" FOR SELECT USING (("status" = 'available'::"public"."item_status"));



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for inspection reports" ON "public"."inspection_reports" FOR SELECT USING (((( SELECT "public"."get_user_role"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_role") = 'admin'::"text") OR (( SELECT "auth"."uid"() AS "uid") = "agent_id")));



CREATE POLICY "Public can view available and sold items" ON "public"."items" FOR SELECT USING (("status" = ANY (ARRAY['available'::"public"."item_status", 'sold'::"public"."item_status"])));



CREATE POLICY "Public categories are viewable by everyone." ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public constants are viewable by everyone" ON "public"."constants" FOR SELECT USING (true);



CREATE POLICY "Users and admins can view relevant order history" ON "public"."order_history" FOR SELECT USING (((( SELECT "public"."get_user_role"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_role") = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_history"."order_id") AND (("orders"."buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("orders"."seller_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "Users can create their own orders" ON "public"."orders" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "buyer_id"));



CREATE POLICY "Users can delete their own items" ON "public"."items" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "seller_id"));



CREATE POLICY "Users can insert their own chat messages" ON "public"."chat_messages" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "sender_id"));



CREATE POLICY "Users can insert their own items" ON "public"."items" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "seller_id"));



CREATE POLICY "Users can manage their own notifications" ON "public"."notifications" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Users can update their own items" ON "public"."items" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "seller_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "seller_id"));



CREATE POLICY "Users can update their own orders and admins can update all" ON "public"."orders" FOR UPDATE USING (((( SELECT "public"."get_user_role"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_role") = 'admin'::"text") OR (( SELECT "auth"."uid"() AS "uid") = "buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "agent_id")));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view their own chat messages" ON "public"."chat_messages" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "sender_id") OR (( SELECT "auth"."uid"() AS "uid") = "recipient_id")));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Users can view their own orders and admins can view all" ON "public"."orders" FOR SELECT USING (((( SELECT "public"."get_user_role"(( SELECT "auth"."uid"() AS "uid")) AS "get_user_role") = 'admin'::"text") OR (( SELECT "auth"."uid"() AS "uid") = "buyer_id") OR (( SELECT "auth"."uid"() AS "uid") = "seller_id") OR (( SELECT "auth"."uid"() AS "uid") = "agent_id")));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inspection_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "authenticator";

























































































































































GRANT ALL ON FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_offer_and_create_order"("p_offer_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_credits_to_user"("user_id" "uuid", "amount_to_add" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_credits_to_user"("user_id" "uuid", "amount_to_add" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_credits_to_user"("user_id" "uuid", "amount_to_add" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."adjust_user_credits"("p_user_id" "uuid", "p_amount_to_adjust" integer, "p_admin_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."adjust_user_credits"("p_user_id" "uuid", "p_amount_to_adjust" integer, "p_admin_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."adjust_user_credits"("p_user_id" "uuid", "p_amount_to_adjust" integer, "p_admin_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_new_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_notification"("p_profile_id" "uuid", "p_message" "text", "p_link_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_listing_fee"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_listing_fee"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_listing_fee"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_purchase_fee"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_purchase_fee"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_purchase_fee"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_seller_payout"("p_order_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_initial_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."grant_initial_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_initial_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("item_id_to_increment" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_order_payment"("p_order_id" bigint, "p_buyer_id" "uuid", "p_paystack_ref" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_seller_average_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_seller_average_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_seller_average_rating"() TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."constants" TO "anon";
GRANT ALL ON TABLE "public"."constants" TO "authenticated";
GRANT ALL ON TABLE "public"."constants" TO "service_role";



GRANT ALL ON TABLE "public"."credit_packages" TO "anon";
GRANT ALL ON TABLE "public"."credit_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_packages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_packages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_packages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_packages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."credit_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."credit_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."credit_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."financial_transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."financial_transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."financial_transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inspection_reports" TO "anon";
GRANT ALL ON TABLE "public"."inspection_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."inspection_reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."inspection_reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."inspection_reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."inspection_reports_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."offers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."offers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."offers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_history" TO "anon";
GRANT ALL ON TABLE "public"."order_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_history_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "authenticator";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

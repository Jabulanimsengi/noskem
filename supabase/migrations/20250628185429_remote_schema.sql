create table "public"."likes" (
    "user_id" uuid not null,
    "item_id" bigint not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."items" add column "discount_percentage" integer default 0;

alter table "public"."items" add column "likes_count" integer default 0;

alter table "public"."items" add column "new_item_price" numeric(10,2);

alter table "public"."items" add column "purchase_date" date;

alter table "public"."profiles" add column "availability_notes" text;

CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (user_id, item_id);

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";

alter table "public"."likes" add constraint "likes_item_id_fkey" FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_item_id_fkey";

alter table "public"."likes" add constraint "likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.items
        SET likes_count = likes_count + 1
        WHERE id = NEW.item_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.items
        SET likes_count = likes_count - 1
        WHERE id = OLD.item_id;
    END IF;
    RETURN NULL;
END;
$function$
;

grant delete on table "public"."likes" to "anon";

grant insert on table "public"."likes" to "anon";

grant references on table "public"."likes" to "anon";

grant select on table "public"."likes" to "anon";

grant trigger on table "public"."likes" to "anon";

grant truncate on table "public"."likes" to "anon";

grant update on table "public"."likes" to "anon";

grant delete on table "public"."likes" to "authenticated";

grant insert on table "public"."likes" to "authenticated";

grant references on table "public"."likes" to "authenticated";

grant select on table "public"."likes" to "authenticated";

grant trigger on table "public"."likes" to "authenticated";

grant truncate on table "public"."likes" to "authenticated";

grant update on table "public"."likes" to "authenticated";

grant delete on table "public"."likes" to "service_role";

grant insert on table "public"."likes" to "service_role";

grant references on table "public"."likes" to "service_role";

grant select on table "public"."likes" to "service_role";

grant trigger on table "public"."likes" to "service_role";

grant truncate on table "public"."likes" to "service_role";

grant update on table "public"."likes" to "service_role";

CREATE TRIGGER on_like_change AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION update_likes_count();



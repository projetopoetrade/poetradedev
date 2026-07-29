

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_recent_cron_logs"("p_limit" integer DEFAULT 50) RETURNS TABLE("id" integer, "job_name" "text", "status" "text", "message" "text", "response_body" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.id,
        cl.job_name,
        cl.status,
        cl.message,
        cl.response_body,
        cl.created_at
    FROM cron_job_logs cl
    ORDER BY cl.created_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_recent_cron_logs"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_cron_execution"("p_job_name" "text", "p_status" "text", "p_message" "text" DEFAULT NULL::"text", "p_response_body" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO cron_job_logs (job_name, status, message, response_body)
    VALUES (p_job_name, p_status, p_message, p_response_body);
END;
$$;


ALTER FUNCTION "public"."log_cron_execution"("p_job_name" "text", "p_status" "text", "p_message" "text", "p_response_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_builds_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_builds_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_items_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."builds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "game_version" "text" DEFAULT 'path-of-exile-1'::"text" NOT NULL,
    "league" "text",
    "class" "text" NOT NULL,
    "ascendancy" "text" NOT NULL,
    "main_skill" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "difficulty" "text",
    "budget" "text",
    "pob_code" "text" NOT NULL,
    "pob_hash" character varying(12),
    "image_url" "text",
    "video_url" "text",
    "guide_content" "text",
    "seo_title" "text",
    "seo_description" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    "author" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."builds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_job_logs" (
    "id" integer NOT NULL,
    "job_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "message" "text",
    "response_body" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cron_job_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cron_job_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."cron_job_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cron_job_logs_id_seq" OWNED BY "public"."cron_job_logs"."id";



CREATE OR REPLACE VIEW "public"."cron_jobs_status" AS
 SELECT "job"."jobid",
    "job"."schedule",
    "job"."command",
    "job"."nodename",
    "job"."nodeport",
    "job"."database",
    "job"."username",
    "job"."active",
    "job"."jobname"
   FROM "cron"."job"
  ORDER BY "job"."jobid";


ALTER TABLE "public"."cron_jobs_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."difficulties" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "gameversion" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."difficulties" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."difficulties_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."difficulties_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."difficulties_id_seq" OWNED BY "public"."difficulties"."id";



CREATE TABLE IF NOT EXISTS "public"."exchange_rate_cache" (
    "id" "text" NOT NULL,
    "rates" "jsonb" NOT NULL,
    "source" "text" NOT NULL,
    "fetched_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exchange_rate_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "class" "text",
    "class_id" "text",
    "rarity" "text",
    "rarity_id" "text",
    "base_item" "text",
    "metadata_id" "text",
    "release_version" "text",
    "removal_version" "text",
    "drop_enabled" boolean,
    "drop_level" integer,
    "drop_level_maximum" integer,
    "is_drop_restricted" boolean DEFAULT false,
    "drop_text" "text",
    "required_level" integer,
    "required_strength" integer,
    "required_dexterity" integer,
    "required_intelligence" integer,
    "is_corrupted" boolean DEFAULT false,
    "is_replica" boolean DEFAULT false,
    "is_fractured" boolean DEFAULT false,
    "is_synthesised" boolean DEFAULT false,
    "is_in_game" boolean DEFAULT true,
    "is_account_bound" boolean DEFAULT false,
    "is_unmodifiable" boolean DEFAULT false,
    "is_veiled" boolean DEFAULT false,
    "is_eater_of_worlds_item" boolean DEFAULT false,
    "is_searing_exarch_item" boolean DEFAULT false,
    "cannot_be_traded_or_modified" boolean DEFAULT false,
    "frame_type" integer,
    "quality" integer,
    "size_x" integer,
    "size_y" integer,
    "tags" "text"[],
    "influences" "text"[],
    "description" "text",
    "stat_text" "text",
    "explicit_stat_text" "text",
    "implicit_stat_text" "text",
    "flavour_text" "text",
    "help_text" "text",
    "inventory_icon" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leagues" (
    "id" bigint NOT NULL,
    "gameVersion" "text",
    "name" "text" NOT NULL,
    "imageUrl" "text",
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "isActive" boolean,
    "difficulty" "text",
    "poe_ninja_name" "text",
    "league_slug" "text",
    "is_published" boolean,
    "divine_usd" numeric,
    "price_markup" numeric DEFAULT 0.5 NOT NULL
);


ALTER TABLE "public"."leagues" OWNER TO "postgres";


COMMENT ON TABLE "public"."leagues" IS 'Leagues table with RLS enabled. Public read access. Admin operations (INSERT/UPDATE/DELETE) handled by service role via API routes.';



ALTER TABLE "public"."leagues" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."leagues_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "character_name" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "total_amount" numeric NOT NULL,
    "items" "jsonb" NOT NULL,
    "stripe_session_id" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "payment_intent" "jsonb",
    "payment_status" "text",
    "observations" "text",
    "payment_method" "text",
    "payment_data" "jsonb",
    "payment_url" "text",
    "pix_qrcode_id" "text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'Orders table with RLS enabled. Users can only see/create their own orders. Updates are handled by admin service role (Stripe webhooks).';



COMMENT ON COLUMN "public"."orders"."payment_data" IS 'Payment provider specific data (AbacatePay billing data, Stripe payment intent, etc.)';



COMMENT ON COLUMN "public"."orders"."payment_url" IS 'Payment URL for redirecting users to payment page (AbacatePay billing URL)';



ALTER TABLE "public"."orders" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pob_builds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pob_code" "text" NOT NULL,
    "pob_hash" character varying(12),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pobbin_key" "text"
);


ALTER TABLE "public"."pob_builds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "imgUrl" "text" DEFAULT ''::"text" NOT NULL,
    "category" "text" DEFAULT ''::"text" NOT NULL,
    "price" numeric NOT NULL,
    "league" "text",
    "gameVersion" "text",
    "difficulty" "text" DEFAULT ''::"text",
    "alt" "text" DEFAULT 'pathoftrade.net'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "in_stock" boolean DEFAULT true,
    "is_listed" boolean DEFAULT false,
    "url_slug" "text",
    "price_divine" numeric,
    "price_locked" boolean DEFAULT false NOT NULL,
    "metadata_id" "text",
    "price_source" "text",
    "min_quantity" integer DEFAULT 1 NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "featured_order" integer
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Products table with RLS enabled. Public read access. Admin operations (INSERT/UPDATE/DELETE) handled by service role via API routes.';



COMMENT ON COLUMN "public"."products"."alt" IS 'text for alt image product';



ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."skill_gems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "strength_percent" integer,
    "dexterity_percent" integer,
    "intelligence_percent" integer,
    "primary_attribute" "text",
    "gem_description" "text",
    "gem_tags" "text"[],
    "support_gem_letter" "text",
    "is_awakened_support_gem" boolean DEFAULT false,
    "is_vaal_skill_gem" boolean DEFAULT false,
    "awakened_variant_id" "text",
    "vaal_variant_id" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."skill_gems" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cron_job_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cron_job_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."difficulties" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."difficulties_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."builds"
    ADD CONSTRAINT "builds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."builds"
    ADD CONSTRAINT "builds_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cron_job_logs"
    ADD CONSTRAINT "cron_job_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."difficulties"
    ADD CONSTRAINT "difficulties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_rate_cache"
    ADD CONSTRAINT "exchange_rate_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_metadata_id_key" UNIQUE ("metadata_id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_league_slug_key" UNIQUE ("league_slug");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pob_builds"
    ADD CONSTRAINT "pob_builds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_gems"
    ADD CONSTRAINT "skill_gems_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."skill_gems"
    ADD CONSTRAINT "skill_gems_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_builds_ascendancy" ON "public"."builds" USING "btree" ("ascendancy");



CREATE INDEX "idx_builds_class" ON "public"."builds" USING "btree" ("class");



CREATE INDEX "idx_builds_game_version" ON "public"."builds" USING "btree" ("game_version");



CREATE INDEX "idx_builds_league" ON "public"."builds" USING "btree" ("league");



CREATE INDEX "idx_builds_published_created" ON "public"."builds" USING "btree" ("is_published", "created_at" DESC);



CREATE UNIQUE INDEX "idx_builds_slug" ON "public"."builds" USING "btree" ("slug");



CREATE INDEX "idx_builds_tags" ON "public"."builds" USING "gin" ("tags");



CREATE INDEX "idx_cron_logs_created_at" ON "public"."cron_job_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cron_logs_job_name" ON "public"."cron_job_logs" USING "btree" ("job_name");



CREATE INDEX "idx_items_base_item" ON "public"."items" USING "btree" ("base_item");



CREATE INDEX "idx_items_class" ON "public"."items" USING "btree" ("class");



CREATE INDEX "idx_items_class_id" ON "public"."items" USING "btree" ("class_id");



CREATE INDEX "idx_items_drop_level" ON "public"."items" USING "btree" ("drop_level");



CREATE INDEX "idx_items_frame_type" ON "public"."items" USING "btree" ("frame_type");



CREATE INDEX "idx_items_influences" ON "public"."items" USING "gin" ("influences");



CREATE INDEX "idx_items_is_in_game" ON "public"."items" USING "btree" ("is_in_game");



CREATE INDEX "idx_items_name" ON "public"."items" USING "btree" ("name");



CREATE INDEX "idx_items_rarity" ON "public"."items" USING "btree" ("rarity");



CREATE INDEX "idx_items_release" ON "public"."items" USING "btree" ("release_version");



CREATE INDEX "idx_items_tags" ON "public"."items" USING "gin" ("tags");



CREATE INDEX "idx_pob_builds_created_at" ON "public"."pob_builds" USING "btree" ("created_at");



CREATE UNIQUE INDEX "idx_pob_builds_hash" ON "public"."pob_builds" USING "btree" ("pob_hash");



CREATE INDEX "idx_products_metadata_id" ON "public"."products" USING "btree" ("metadata_id");



CREATE INDEX "idx_products_reprice" ON "public"."products" USING "btree" ("league", "price_locked");



CREATE INDEX "idx_products_url_slug" ON "public"."products" USING "btree" ("url_slug");



CREATE INDEX "idx_skill_gems_is_awakened" ON "public"."skill_gems" USING "btree" ("is_awakened_support_gem");



CREATE INDEX "idx_skill_gems_is_vaal" ON "public"."skill_gems" USING "btree" ("is_vaal_skill_gem");



CREATE INDEX "idx_skill_gems_name" ON "public"."skill_gems" USING "btree" ("name");



CREATE INDEX "idx_skill_gems_primary_attribute" ON "public"."skill_gems" USING "btree" ("primary_attribute");



CREATE INDEX "idx_skill_gems_tags" ON "public"."skill_gems" USING "gin" ("gem_tags");



CREATE INDEX "products_featured_idx" ON "public"."products" USING "btree" ("featured_order") WHERE "is_featured";



CREATE OR REPLACE TRIGGER "trg_items_updated_at" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."update_items_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_builds_updated_at" BEFORE UPDATE ON "public"."builds" FOR EACH ROW EXECUTE FUNCTION "public"."update_builds_updated_at"();



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow public insert pob builds" ON "public"."pob_builds" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read items" ON "public"."items" FOR SELECT USING (true);



CREATE POLICY "Allow public read skill_gems" ON "public"."skill_gems" FOR SELECT USING (true);



CREATE POLICY "Allow public select pob builds" ON "public"."pob_builds" FOR SELECT USING (true);



CREATE POLICY "Allow service_role write items" ON "public"."items" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Allow service_role write skill_gems" ON "public"."skill_gems" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Public can read published builds" ON "public"."builds" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public read access for difficulties" ON "public"."difficulties" FOR SELECT USING (true);



ALTER TABLE "public"."builds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."difficulties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leagues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pob_builds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_can_view_leagues" ON "public"."leagues" FOR SELECT USING (true);



CREATE POLICY "public_can_view_products" ON "public"."products" FOR SELECT USING (true);



ALTER TABLE "public"."skill_gems" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_can_create_own_orders" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_view_own_orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





























































































































































































GRANT ALL ON FUNCTION "public"."get_recent_cron_logs"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recent_cron_logs"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_cron_logs"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_cron_execution"("p_job_name" "text", "p_status" "text", "p_message" "text", "p_response_body" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_cron_execution"("p_job_name" "text", "p_status" "text", "p_message" "text", "p_response_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_cron_execution"("p_job_name" "text", "p_status" "text", "p_message" "text", "p_response_body" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_builds_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_builds_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_builds_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_items_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_items_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_items_updated_at"() TO "service_role";












SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;









GRANT ALL ON TABLE "public"."builds" TO "anon";
GRANT ALL ON TABLE "public"."builds" TO "authenticated";
GRANT ALL ON TABLE "public"."builds" TO "service_role";



GRANT ALL ON TABLE "public"."cron_job_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cron_job_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cron_job_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cron_job_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cron_jobs_status" TO "anon";
GRANT ALL ON TABLE "public"."cron_jobs_status" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_jobs_status" TO "service_role";



GRANT ALL ON TABLE "public"."difficulties" TO "anon";
GRANT ALL ON TABLE "public"."difficulties" TO "authenticated";
GRANT ALL ON TABLE "public"."difficulties" TO "service_role";



GRANT ALL ON SEQUENCE "public"."difficulties_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."difficulties_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."difficulties_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rate_cache" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rate_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rate_cache" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."leagues" TO "anon";
GRANT ALL ON TABLE "public"."leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."leagues" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pob_builds" TO "anon";
GRANT ALL ON TABLE "public"."pob_builds" TO "authenticated";
GRANT ALL ON TABLE "public"."pob_builds" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."skill_gems" TO "anon";
GRANT ALL ON TABLE "public"."skill_gems" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_gems" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































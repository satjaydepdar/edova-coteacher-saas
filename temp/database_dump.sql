--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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

ALTER TABLE IF EXISTS ONLY public.video_payloads DROP CONSTRAINT IF EXISTS video_payloads_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_tenant_mappings DROP CONSTRAINT IF EXISTS user_tenant_mappings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_tenant_mappings DROP CONSTRAINT IF EXISTS user_tenant_mappings_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_tenant_mappings DROP CONSTRAINT IF EXISTS user_tenant_mappings_section_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trig_student_states DROP CONSTRAINT IF EXISTS trig_student_states_concept_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trig_prerequisites DROP CONSTRAINT IF EXISTS trig_prerequisites_prerequisite_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trig_prerequisites DROP CONSTRAINT IF EXISTS trig_prerequisites_concept_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trig_interaction_logs DROP CONSTRAINT IF EXISTS trig_interaction_logs_concept_id_fkey;
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS topics_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_quiz_attempts DROP CONSTRAINT IF EXISTS student_quiz_attempts_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_quiz_attempts DROP CONSTRAINT IF EXISTS student_quiz_attempts_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_quiz_attempts DROP CONSTRAINT IF EXISTS student_quiz_attempts_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_progress DROP CONSTRAINT IF EXISTS student_progress_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_progress DROP CONSTRAINT IF EXISTS student_progress_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_progress DROP CONSTRAINT IF EXISTS student_progress_activation_key_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_lab_submissions DROP CONSTRAINT IF EXISTS student_lab_submissions_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_lab_submissions DROP CONSTRAINT IF EXISTS student_lab_submissions_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_lab_submissions DROP CONSTRAINT IF EXISTS student_lab_submissions_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sections DROP CONSTRAINT IF EXISTS sections_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_generated_sets DROP CONSTRAINT IF EXISTS quiz_generated_sets_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_generated_sets DROP CONSTRAINT IF EXISTS quiz_generated_sets_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_generated_sets DROP CONSTRAINT IF EXISTS quiz_generated_sets_activation_key_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quiz_configurations DROP CONSTRAINT IF EXISTS quiz_configurations_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.question_bank DROP CONSTRAINT IF EXISTS question_bank_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.question_bank DROP CONSTRAINT IF EXISTS question_bank_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress_events DROP CONSTRAINT IF EXISTS progress_events_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress_events DROP CONSTRAINT IF EXISTS progress_events_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.progress_events DROP CONSTRAINT IF EXISTS progress_events_activation_key_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_topic_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_payloads DROP CONSTRAINT IF EXISTS lab_payloads_module_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_questions DROP CONSTRAINT IF EXISTS fk_authored_questions_current_version;
ALTER TABLE IF EXISTS ONLY public.device_activations DROP CONSTRAINT IF EXISTS device_activations_key_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS chapters_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_tests DROP CONSTRAINT IF EXISTS authored_tests_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_tests DROP CONSTRAINT IF EXISTS authored_tests_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_test_questions DROP CONSTRAINT IF EXISTS authored_test_questions_test_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_test_questions DROP CONSTRAINT IF EXISTS authored_test_questions_question_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_test_assignments DROP CONSTRAINT IF EXISTS authored_test_assignments_test_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_test_assignments DROP CONSTRAINT IF EXISTS authored_test_assignments_section_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_questions DROP CONSTRAINT IF EXISTS authored_questions_topic_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_questions DROP CONSTRAINT IF EXISTS authored_questions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_questions DROP CONSTRAINT IF EXISTS authored_questions_chapter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_question_versions DROP CONSTRAINT IF EXISTS authored_question_versions_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_question_versions DROP CONSTRAINT IF EXISTS authored_question_versions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_question_media DROP CONSTRAINT IF EXISTS authored_question_media_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.authored_question_media DROP CONSTRAINT IF EXISTS authored_question_media_question_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_actor_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activation_keys DROP CONSTRAINT IF EXISTS activation_keys_tenant_id_fkey;
DROP INDEX IF EXISTS public.ix_trig_telemetry_events_timestamp;
DROP INDEX IF EXISTS public.ix_trig_telemetry_events_student_id;
DROP INDEX IF EXISTS public.ix_trig_telemetry_events_event_type;
DROP INDEX IF EXISTS public.ix_trig_telemetry_events_concept_id;
DROP INDEX IF EXISTS public.ix_trig_student_states_student_id;
DROP INDEX IF EXISTS public.ix_trig_interaction_logs_timestamp;
DROP INDEX IF EXISTS public.ix_trig_interaction_logs_student_id;
DROP INDEX IF EXISTS public.idx_user_tenant_mappings_tenant;
DROP INDEX IF EXISTS public.idx_user_tenant_mappings_section;
DROP INDEX IF EXISTS public.idx_test_assignments_test;
DROP INDEX IF EXISTS public.idx_test_assignments_section;
DROP INDEX IF EXISTS public.idx_subjects_tenant_grade;
DROP INDEX IF EXISTS public.idx_subjects_global_sequence;
DROP INDEX IF EXISTS public.idx_quiz_attempt_student_time;
DROP INDEX IF EXISTS public.idx_quiz_attempt_student_module;
DROP INDEX IF EXISTS public.idx_question_bank_subject;
DROP INDEX IF EXISTS public.idx_question_bank_selection;
DROP INDEX IF EXISTS public.idx_question_bank_hash;
DROP INDEX IF EXISTS public.idx_qgs_student_module;
DROP INDEX IF EXISTS public.idx_qgs_key_module;
DROP INDEX IF EXISTS public.idx_progress_user_module;
DROP INDEX IF EXISTS public.idx_progress_student_status;
DROP INDEX IF EXISTS public.idx_progress_key_module;
DROP INDEX IF EXISTS public.idx_progress_events_student_module;
DROP INDEX IF EXISTS public.idx_modules_topic_sequence;
DROP INDEX IF EXISTS public.idx_modules_chapter_sequence;
DROP INDEX IF EXISTS public.idx_mastery_events_student;
DROP INDEX IF EXISTS public.idx_mastery_events_classroom_chapter;
DROP INDEX IF EXISTS public.idx_lab_submission_student_module;
DROP INDEX IF EXISTS public.idx_authored_tests_created_by;
DROP INDEX IF EXISTS public.idx_authored_tests_chapter;
DROP INDEX IF EXISTS public.idx_authored_test_questions_version;
DROP INDEX IF EXISTS public.idx_authored_test_questions_test;
DROP INDEX IF EXISTS public.idx_authored_questions_created_by;
DROP INDEX IF EXISTS public.idx_authored_questions_chapter_status_created;
DROP INDEX IF EXISTS public.idx_authored_question_versions_question_type_diff;
DROP INDEX IF EXISTS public.idx_authored_question_versions_created_by;
DROP INDEX IF EXISTS public.idx_authored_question_media_version;
DROP INDEX IF EXISTS public.idx_audit_at;
DROP INDEX IF EXISTS public.idx_audit_actor;
DROP INDEX IF EXISTS public.idx_activation_keys_tenant;
ALTER TABLE IF EXISTS ONLY public.video_payloads DROP CONSTRAINT IF EXISTS video_payloads_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_tenant_mappings DROP CONSTRAINT IF EXISTS user_tenant_mappings_user_id_tenant_id_key;
ALTER TABLE IF EXISTS ONLY public.user_tenant_mappings DROP CONSTRAINT IF EXISTS user_tenant_mappings_pkey;
ALTER TABLE IF EXISTS ONLY public.trig_telemetry_events DROP CONSTRAINT IF EXISTS trig_telemetry_events_pkey;
ALTER TABLE IF EXISTS ONLY public.trig_student_states DROP CONSTRAINT IF EXISTS trig_student_states_pkey;
ALTER TABLE IF EXISTS ONLY public.trig_prerequisites DROP CONSTRAINT IF EXISTS trig_prerequisites_pkey;
ALTER TABLE IF EXISTS ONLY public.trig_interaction_logs DROP CONSTRAINT IF EXISTS trig_interaction_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.trig_concepts DROP CONSTRAINT IF EXISTS trig_concepts_pkey;
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS topics_pkey;
ALTER TABLE IF EXISTS ONLY public.topics DROP CONSTRAINT IF EXISTS topics_chapter_id_sequence_order_key;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_tenant_id_sequence_order_key;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.student_quiz_attempts DROP CONSTRAINT IF EXISTS student_quiz_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.student_progress DROP CONSTRAINT IF EXISTS student_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.student_lab_submissions DROP CONSTRAINT IF EXISTS student_lab_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.sections DROP CONSTRAINT IF EXISTS sections_tenant_id_name_key;
ALTER TABLE IF EXISTS ONLY public.sections DROP CONSTRAINT IF EXISTS sections_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_generated_sets DROP CONSTRAINT IF EXISTS quiz_generated_sets_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_configurations DROP CONSTRAINT IF EXISTS quiz_configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.question_bank DROP CONSTRAINT IF EXISTS question_bank_pkey;
ALTER TABLE IF EXISTS ONLY public.progress_events DROP CONSTRAINT IF EXISTS progress_events_pkey;
ALTER TABLE IF EXISTS ONLY public.progress_events DROP CONSTRAINT IF EXISTS progress_events_client_event_id_key;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_pkey;
ALTER TABLE IF EXISTS ONLY public.modules DROP CONSTRAINT IF EXISTS modules_chapter_id_sequence_order_key;
ALTER TABLE IF EXISTS ONLY public.mastery_events DROP CONSTRAINT IF EXISTS mastery_events_pkey;
ALTER TABLE IF EXISTS ONLY public.lab_payloads DROP CONSTRAINT IF EXISTS lab_payloads_pkey;
ALTER TABLE IF EXISTS ONLY public.device_activations DROP CONSTRAINT IF EXISTS device_activations_pkey;
ALTER TABLE IF EXISTS ONLY public.device_activations DROP CONSTRAINT IF EXISTS device_activations_key_id_device_id_key;
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS chapters_subject_id_sequence_order_key;
ALTER TABLE IF EXISTS ONLY public.chapters DROP CONSTRAINT IF EXISTS chapters_pkey;
ALTER TABLE IF EXISTS ONLY public.authored_tests DROP CONSTRAINT IF EXISTS authored_tests_pkey;
ALTER TABLE IF EXISTS ONLY public.authored_test_questions DROP CONSTRAINT IF EXISTS authored_test_questions_test_id_sequence_order_key;
ALTER TABLE IF EXISTS ONLY public.authored_test_questions DROP CONSTRAINT IF EXISTS authored_test_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.authored_test_assignments DROP CONSTRAINT IF EXISTS authored_test_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.authored_questions DROP CONSTRAINT IF EXISTS authored_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.authored_question_versions DROP CONSTRAINT IF EXISTS authored_question_versions_question_id_version_no_key;
ALTER TABLE IF EXISTS ONLY public.authored_question_versions DROP CONSTRAINT IF EXISTS authored_question_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.authored_question_media DROP CONSTRAINT IF EXISTS authored_question_media_storage_key_key;
ALTER TABLE IF EXISTS ONLY public.authored_question_media DROP CONSTRAINT IF EXISTS authored_question_media_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.activation_keys DROP CONSTRAINT IF EXISTS activation_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.activation_keys DROP CONSTRAINT IF EXISTS activation_keys_key_code_key;
ALTER TABLE IF EXISTS public.trig_telemetry_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trig_student_states ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trig_interaction_logs ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.video_payloads;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_tenant_mappings;
DROP SEQUENCE IF EXISTS public.trig_telemetry_events_id_seq;
DROP TABLE IF EXISTS public.trig_telemetry_events;
DROP SEQUENCE IF EXISTS public.trig_student_states_id_seq;
DROP TABLE IF EXISTS public.trig_student_states;
DROP TABLE IF EXISTS public.trig_prerequisites;
DROP SEQUENCE IF EXISTS public.trig_interaction_logs_id_seq;
DROP TABLE IF EXISTS public.trig_interaction_logs;
DROP TABLE IF EXISTS public.trig_concepts;
DROP TABLE IF EXISTS public.topics;
DROP TABLE IF EXISTS public.tenants;
DROP TABLE IF EXISTS public.subscriptions;
DROP TABLE IF EXISTS public.subscription_plans;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.student_quiz_attempts;
DROP TABLE IF EXISTS public.student_progress;
DROP TABLE IF EXISTS public.student_lab_submissions;
DROP TABLE IF EXISTS public.sections;
DROP TABLE IF EXISTS public.quiz_generated_sets;
DROP TABLE IF EXISTS public.quiz_configurations;
DROP TABLE IF EXISTS public.question_bank;
DROP TABLE IF EXISTS public.progress_events;
DROP TABLE IF EXISTS public.modules;
DROP TABLE IF EXISTS public.mastery_events;
DROP TABLE IF EXISTS public.lab_payloads;
DROP TABLE IF EXISTS public.device_activations;
DROP TABLE IF EXISTS public.chapters;
DROP TABLE IF EXISTS public.authored_tests;
DROP TABLE IF EXISTS public.authored_test_questions;
DROP TABLE IF EXISTS public.authored_test_assignments;
DROP TABLE IF EXISTS public.authored_questions;
DROP TABLE IF EXISTS public.authored_question_versions;
DROP TABLE IF EXISTS public.authored_question_media;
DROP TABLE IF EXISTS public.admin_audit_log;
DROP TABLE IF EXISTS public.activation_keys;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activation_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activation_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_code character varying(20) NOT NULL,
    tenant_id uuid NOT NULL,
    max_devices integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'UNUSED'::character varying NOT NULL,
    expires_at date NOT NULL,
    activated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activation_keys_max_devices_check CHECK ((max_devices > 0)),
    CONSTRAINT activation_keys_status_check CHECK (((status)::text = ANY (ARRAY[('UNUSED'::character varying)::text, ('ACTIVE'::character varying)::text, ('REVOKED'::character varying)::text])))
);


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id uuid,
    action character varying(16) NOT NULL,
    path text NOT NULL,
    status_code integer NOT NULL,
    ip inet
);


--
-- Name: authored_question_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authored_question_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_version_id uuid NOT NULL,
    storage_key text NOT NULL,
    file_name character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    caption text,
    sequence_order integer DEFAULT 0 NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: authored_question_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authored_question_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    version_no integer NOT NULL,
    question_type character varying(30) NOT NULL,
    question_text text NOT NULL,
    marks numeric(5,2) DEFAULT 1 NOT NULL,
    difficulty character varying(10),
    options jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    passage text,
    explanation text,
    CONSTRAINT authored_question_versions_difficulty_check CHECK (((difficulty)::text = ANY (ARRAY[('EASY'::character varying)::text, ('MEDIUM'::character varying)::text, ('HARD'::character varying)::text]))),
    CONSTRAINT authored_question_versions_question_type_check CHECK (((question_type)::text = ANY (ARRAY[('MCQ'::character varying)::text, ('MCQ_COMBINATION'::character varying)::text, ('ASSERTION_REASONING'::character varying)::text, ('SHORT_ANSWER'::character varying)::text, ('LONG_ANSWER'::character varying)::text, ('FILL_IN_THE_BLANKS'::character varying)::text, ('MATCH_THE_FOLLOWING'::character varying)::text, ('NUMERICAL'::character varying)::text, ('CASE_STUDY'::character varying)::text])))
);


--
-- Name: authored_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authored_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id uuid NOT NULL,
    current_version_id uuid,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    topic_id uuid,
    source_papers jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT authored_questions_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('SUBMITTED'::character varying)::text, ('IN_REVIEW'::character varying)::text, ('REJECTED'::character varying)::text, ('APPROVED'::character varying)::text, ('PUBLISHED'::character varying)::text, ('ARCHIVED'::character varying)::text])))
);


--
-- Name: authored_test_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authored_test_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    section_id uuid,
    opens_at timestamp with time zone NOT NULL,
    closes_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT authored_test_assignments_check CHECK ((closes_at > opens_at))
);


--
-- Name: authored_test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authored_test_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    question_version_id uuid NOT NULL,
    sequence_order integer NOT NULL,
    marks numeric(5,2) NOT NULL
);


--
-- Name: authored_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authored_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    timer_minutes integer NOT NULL,
    total_marks numeric(6,2) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT authored_tests_timer_minutes_check CHECK ((timer_minutes > 0))
);


--
-- Name: chapters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chapters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    sequence_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: device_activations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_activations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_id uuid NOT NULL,
    device_id text NOT NULL,
    activated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: lab_payloads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_payloads (
    module_id uuid NOT NULL,
    environment_type character varying(30) NOT NULL,
    instructions_markdown text NOT NULL,
    initial_state_code text DEFAULT ''::text,
    validation_rules jsonb NOT NULL,
    s3_file_key text,
    CONSTRAINT lab_payloads_environment_type_check CHECK (((environment_type)::text = 'VIRTUAL_LAB'::text))
);


--
-- Name: mastery_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastery_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    classroom_id text NOT NULL,
    student_id text NOT NULL,
    student_name text,
    chapter_id text NOT NULL,
    concept_id text NOT NULL,
    event_type text NOT NULL,
    error_detail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    module_type character varying(20) NOT NULL,
    sequence_order integer NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    topic_id uuid,
    CONSTRAINT modules_module_type_check CHECK (((module_type)::text = ANY (ARRAY[('VIDEO'::character varying)::text, ('LAB'::character varying)::text, ('QUIZ'::character varying)::text])))
);


--
-- Name: progress_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    module_id uuid NOT NULL,
    delta_seconds integer NOT NULL,
    client_event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activation_key_id uuid,
    CONSTRAINT progress_events_delta_seconds_check CHECK ((delta_seconds > 0)),
    CONSTRAINT progress_events_one_principal CHECK (((student_id IS NOT NULL) OR (activation_key_id IS NOT NULL)))
);


--
-- Name: question_bank; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_bank (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    chapter_id uuid NOT NULL,
    year integer NOT NULL,
    difficulty character varying(10) NOT NULL,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_answer character varying(5) NOT NULL,
    explanation text NOT NULL,
    content_hash text NOT NULL,
    CONSTRAINT question_bank_difficulty_check CHECK (((difficulty)::text = ANY (ARRAY[('EASY'::character varying)::text, ('MEDIUM'::character varying)::text, ('HARD'::character varying)::text])))
);


--
-- Name: quiz_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_configurations (
    module_id uuid NOT NULL,
    time_limit_minutes integer NOT NULL,
    passing_percentage integer NOT NULL,
    selection_rules jsonb NOT NULL,
    max_attempts integer,
    CONSTRAINT quiz_configurations_passing_percentage_check CHECK (((passing_percentage >= 0) AND (passing_percentage <= 100)))
);


--
-- Name: quiz_generated_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_generated_sets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    module_id uuid NOT NULL,
    question_ids uuid[] NOT NULL,
    shortfall_flag boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activation_key_id uuid
);


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    grade character varying(10)
);


--
-- Name: student_lab_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_lab_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    module_id uuid NOT NULL,
    chapter_id uuid NOT NULL,
    interaction_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT student_lab_submissions_time_spent_check CHECK ((time_spent >= 0))
);


--
-- Name: student_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_progress (
    student_id uuid,
    module_id uuid NOT NULL,
    status character varying(20) DEFAULT 'not_started'::character varying NOT NULL,
    progress_pct integer DEFAULT 0 NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    last_accessed timestamp with time zone,
    completed_at timestamp with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activation_key_id uuid,
    CONSTRAINT student_progress_one_principal CHECK (((student_id IS NOT NULL) OR (activation_key_id IS NOT NULL))),
    CONSTRAINT student_progress_progress_pct_check CHECK (((progress_pct >= 0) AND (progress_pct <= 100))),
    CONSTRAINT student_progress_status_check CHECK (((status)::text = ANY (ARRAY[('not_started'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text]))),
    CONSTRAINT student_progress_time_spent_check CHECK ((time_spent >= 0))
);


--
-- Name: student_quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    module_id uuid NOT NULL,
    chapter_id uuid NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    answers jsonb NOT NULL,
    CONSTRAINT student_quiz_attempts_score_check CHECK ((score >= 0)),
    CONSTRAINT student_quiz_attempts_time_spent_check CHECK ((time_spent >= 0)),
    CONSTRAINT student_quiz_attempts_total_questions_check CHECK ((total_questions > 0))
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name character varying(255) NOT NULL,
    standard_grade character varying(50) NOT NULL,
    thumbnail_url text,
    sequence_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    tier_level integer NOT NULL,
    allow_video boolean DEFAULT false NOT NULL,
    allow_lab boolean DEFAULT false NOT NULL,
    allow_quiz boolean DEFAULT false NOT NULL,
    price_inr integer DEFAULT 0 NOT NULL,
    blurb text DEFAULT ''::text NOT NULL,
    included_seats integer DEFAULT 1 NOT NULL,
    CONSTRAINT subscription_plans_included_seats_check CHECK ((included_seats > 0)),
    CONSTRAINT subscription_plans_tier_level_check CHECK ((tier_level = ANY (ARRAY[1, 2, 3, 4])))
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    seat_count integer DEFAULT 1 NOT NULL,
    CONSTRAINT subscriptions_seat_count_check CHECK ((seat_count > 0))
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tenants_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('SUSPENDED'::character varying)::text, ('EXPIRED'::character varying)::text]))),
    CONSTRAINT tenants_type_check CHECK (((type)::text = ANY (ARRAY[('SCHOOL'::character varying)::text, ('INDIVIDUAL'::character varying)::text, ('PLATFORM'::character varying)::text])))
);


--
-- Name: topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chapter_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    sequence_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: trig_concepts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trig_concepts (
    id character varying NOT NULL,
    title character varying NOT NULL,
    chapter character varying,
    difficulty double precision,
    description text,
    formula_reference character varying,
    problem_data json
);


--
-- Name: trig_interaction_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trig_interaction_logs (
    id integer NOT NULL,
    student_id character varying NOT NULL,
    concept_id character varying NOT NULL,
    step_index integer NOT NULL,
    raw_input character varying,
    step_score double precision NOT NULL,
    response_time double precision,
    sal_at_step double precision NOT NULL,
    mastery_at_step double precision NOT NULL,
    strategy_used character varying,
    "timestamp" timestamp without time zone
);


--
-- Name: trig_interaction_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trig_interaction_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trig_interaction_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trig_interaction_logs_id_seq OWNED BY public.trig_interaction_logs.id;


--
-- Name: trig_prerequisites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trig_prerequisites (
    concept_id character varying NOT NULL,
    prerequisite_id character varying NOT NULL
);


--
-- Name: trig_student_states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trig_student_states (
    id integer NOT NULL,
    student_id character varying NOT NULL,
    concept_id character varying NOT NULL,
    active_step_index integer,
    mastery_score double precision,
    scaffold_assistance_level double precision,
    consecutive_correct integer,
    cognitive_profile json,
    updated_at timestamp without time zone
);


--
-- Name: trig_student_states_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trig_student_states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trig_student_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trig_student_states_id_seq OWNED BY public.trig_student_states.id;


--
-- Name: trig_telemetry_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trig_telemetry_events (
    id integer NOT NULL,
    student_id character varying NOT NULL,
    concept_id character varying,
    step_index integer,
    event_type character varying NOT NULL,
    event_payload json,
    "timestamp" timestamp without time zone
);


--
-- Name: trig_telemetry_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trig_telemetry_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trig_telemetry_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trig_telemetry_events_id_seq OWNED BY public.trig_telemetry_events.id;


--
-- Name: user_tenant_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tenant_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    section_id uuid,
    CONSTRAINT user_tenant_mappings_role_check CHECK (((role)::text = ANY (ARRAY[('STUDENT'::character varying)::text, ('ADMIN'::character varying)::text, ('TEACHER'::character varying)::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    full_name character varying(255) NOT NULL
);


--
-- Name: video_payloads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_payloads (
    module_id uuid NOT NULL,
    hls_master_url text,
    duration_seconds integer DEFAULT 0 NOT NULL,
    thumbnail_url text,
    subtitle_tracks jsonb DEFAULT '[]'::jsonb,
    s3_key_prefix text,
    transcode_status character varying(20) DEFAULT 'READY'::character varying NOT NULL,
    transcode_error text,
    CONSTRAINT video_payloads_transcode_status_check CHECK (((transcode_status)::text = ANY (ARRAY[('PROCESSING'::character varying)::text, ('READY'::character varying)::text, ('FAILED'::character varying)::text])))
);


--
-- Name: trig_interaction_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_interaction_logs ALTER COLUMN id SET DEFAULT nextval('public.trig_interaction_logs_id_seq'::regclass);


--
-- Name: trig_student_states id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_student_states ALTER COLUMN id SET DEFAULT nextval('public.trig_student_states_id_seq'::regclass);


--
-- Name: trig_telemetry_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_telemetry_events ALTER COLUMN id SET DEFAULT nextval('public.trig_telemetry_events_id_seq'::regclass);


--
-- Data for Name: activation_keys; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.activation_keys VALUES ('5cae7265-58f3-429b-9ae9-4c155b9dab55', 'EDOVA-S2Q3-XRMB-GJXV', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-08-28 13:17:12.910159+05:30', '2026-08-28 13:16:41.274335+05:30');
INSERT INTO public.activation_keys VALUES ('01bcd3c7-09ad-4043-8b39-b383b40b5cc3', 'EDOVA-FB3Q-6EZF-FE4X', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-19 13:26:25.149275+05:30');
INSERT INTO public.activation_keys VALUES ('43cd467e-175a-417e-be64-7e8ac90a1102', 'EDOVA-H3D9-744M-B79C', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-30 04:08:54.88563+05:30');
INSERT INTO public.activation_keys VALUES ('105ae07d-833c-47a4-8a77-f3b2c18e9fe4', 'EDOVA-NMDV-DHHH-G25T', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 5, 'ACTIVE', '2027-08-28', '2026-08-28 13:29:36.353692+05:30', '2026-08-28 13:29:22.79917+05:30');
INSERT INTO public.activation_keys VALUES ('f9982a6e-6ed5-469c-9ad1-aee5af67a127', 'EDOVA-UU6M-FWSG-2NHX', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 100, 'ACTIVE', '2027-08-28', '2026-08-28 14:22:55.87197+05:30', '2026-08-28 14:22:42.0634+05:30');
INSERT INTO public.activation_keys VALUES ('d819ae71-a2a0-49d0-81f5-8bb45b1d792d', 'EDOVA-UPFH-WF5G-X2XA', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-11 22:52:13.000844+05:30');
INSERT INTO public.activation_keys VALUES ('10f3c0a6-2db9-46c8-b043-74dc5ecf3144', 'EDOVA-47FN-7M3J-DW5F', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 20:58:32.777018+05:30', '2026-09-10 20:58:32.703286+05:30');
INSERT INTO public.activation_keys VALUES ('4625850c-4852-49bf-bd70-3164a081113f', 'EDOVA-PY8Q-98ER-CW5M', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-28 17:29:27.576636+05:30');
INSERT INTO public.activation_keys VALUES ('2aa2a5ed-b3db-490f-86e2-2e72ee3a0508', 'EDOVA-6PNX-8SN3-XTZV', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-11 22:55:20.918911+05:30');
INSERT INTO public.activation_keys VALUES ('5d1d7e0f-41f1-4f9c-87ae-d5b97903cdb3', 'EDOVA-AJ9B-MYM2-5GHV', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 19:20:11.663493+05:30');
INSERT INTO public.activation_keys VALUES ('688cda23-8093-493f-a30b-efa0f1d38cf2', 'EDOVA-WR6R-C4KY-HR5K', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-19 13:29:30.340762+05:30');
INSERT INTO public.activation_keys VALUES ('013e1480-e31f-4711-90a9-e05fbd3aa1c4', 'EDOVA-UQBD-67CJ-VHUE', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-11 23:00:03.720978+05:30');
INSERT INTO public.activation_keys VALUES ('9cbd498c-e773-4daa-b3e6-24863624b247', 'EDOVA-GJNM-25MQ-PMAE', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-28 17:34:06.947125+05:30');
INSERT INTO public.activation_keys VALUES ('e8057ceb-7647-4a2f-8218-0d2e0c6d3981', 'EDOVA-MTWP-VM2D-TBSQ', '424692a8-cb70-4204-b51f-427aaade2709', 1, 'ACTIVE', '2027-12-31', '2026-08-12 08:57:09.439705+05:30', '2026-08-12 08:56:38.447756+05:30');
INSERT INTO public.activation_keys VALUES ('93130e9c-7dd7-4e2c-9a20-30eda3c723b6', 'EDOVA-SXWA-7QUG-XBNJ', '93e6bcb2-c577-44e5-90fc-9a6e02bbb9bd', 2, 'ACTIVE', '2027-01-01', '2026-08-28 17:35:39.595442+05:30', '2026-08-28 17:35:37.258836+05:30');
INSERT INTO public.activation_keys VALUES ('96e1bfd8-7e22-4dd7-b230-5a2560fd0a9a', 'EDOVA-W2NY-6XPE-GNUF', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 20:31:41.942057+05:30');
INSERT INTO public.activation_keys VALUES ('503e8ace-b803-4fb6-a336-c0d7996603e7', 'EDOVA-RGR4-BBDD-DZGJ', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-12 09:23:40.673036+05:30');
INSERT INTO public.activation_keys VALUES ('9130a83e-5221-4fb3-89aa-55ac791d11a2', 'EDOVA-EVFH-RD65-S47A', '424692a8-cb70-4204-b51f-427aaade2709', 10, 'ACTIVE', '2027-12-31', '2026-08-12 19:46:12.921973+05:30', '2026-08-12 19:46:12.404606+05:30');
INSERT INTO public.activation_keys VALUES ('162739ed-0620-4135-a682-f4f9bb4031ea', 'EDOVA-QJAK-C43E-6QT9', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-19 17:48:05.80771+05:30');
INSERT INTO public.activation_keys VALUES ('407d657e-8592-4d92-963f-55b2387c7ad2', 'EDOVA-FMPJ-TNZE-3XZ6', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 19:20:58.534073+05:30');
INSERT INTO public.activation_keys VALUES ('d5577480-0365-43f6-9d0b-72a97e74e782', 'EDOVA-ZM9V-UR4C-XDV7', '7c48313d-283c-4ca4-a570-40b08c3e487d', 25, 'UNUSED', '2027-08-24', NULL, '2026-08-24 17:00:34.372911+05:30');
INSERT INTO public.activation_keys VALUES ('592f1c89-43f2-4042-b45e-ede76db9923b', 'EDOVA-ZDMG-JFBF-RJKX', '8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109', 25, 'ACTIVE', '2027-08-17', '2026-08-17 14:01:31.774222+05:30', '2026-08-17 14:01:09.232982+05:30');
INSERT INTO public.activation_keys VALUES ('38f40dd0-b846-486a-9d7a-c015ebe1aaf9', 'EDOVA-X54C-QWQS-DTBE', '847b1395-302b-4739-9933-567244797927', 25, 'ACTIVE', '2027-08-17', '2026-08-17 19:58:43.6137+05:30', '2026-08-17 19:58:06.196936+05:30');
INSERT INTO public.activation_keys VALUES ('52496a3f-e635-49d0-9544-f0ef7a58dde4', 'EDOVA-CXFX-DP7Y-TBH8', '4895c1b0-362c-4ec9-9f71-151dab3a3a1d', 15, 'UNUSED', '2027-08-17', NULL, '2026-08-17 20:17:46.452685+05:30');
INSERT INTO public.activation_keys VALUES ('7a2a76ec-3a69-4fda-83e1-47012588e12a', 'EDOVA-ZU56-2UWM-DAQT', 'cc18849d-5fe6-496b-bf04-ce1c19e5146d', 25, 'UNUSED', '2027-08-19', NULL, '2026-08-19 09:04:53.125586+05:30');
INSERT INTO public.activation_keys VALUES ('77b61ae4-d82e-4347-bef4-8c846cc6773a', 'EDOVA-SVB4-PAKQ-65HJ', 'cb6f6053-d291-4951-a392-508419a764e9', 25, 'UNUSED', '2027-08-19', NULL, '2026-08-19 12:13:22.695999+05:30');
INSERT INTO public.activation_keys VALUES ('2ad07bbe-fb86-4825-a589-75b69ae401ed', 'EDOVA-SM6N-TX83-VWXE', '08bb65c0-65b2-451a-a5ab-b8d4d24a2eb7', 50, 'ACTIVE', '2027-08-29', '2026-08-29 08:09:40.061861+05:30', '2026-08-29 08:09:25.290181+05:30');
INSERT INTO public.activation_keys VALUES ('533aa983-830d-4e73-92fd-6941da161305', 'EDOVA-4KAS-K7TM-Y589', '02a7455f-ea42-4cab-a763-19f9d770fd22', 25, 'ACTIVE', '2027-08-24', '2026-08-24 17:49:37.669718+05:30', '2026-08-24 17:00:34.758871+05:30');
INSERT INTO public.activation_keys VALUES ('e26067a9-21c6-4bf6-9d95-8849c590c087', 'EDOVA-NU64-96X8-FG2R', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 20:58:49.055946+05:30', '2026-09-10 20:58:48.990889+05:30');
INSERT INTO public.activation_keys VALUES ('601c497d-3935-401e-ae9b-e72b6cab1d92', 'EDOVA-PWGE-VVTR-CABQ', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-08-26 08:39:48.249702+05:30');
INSERT INTO public.activation_keys VALUES ('00da9651-bd0c-4898-b719-e77a260cbe6e', 'EDOVA-ZUEW-VZ8T-KET4', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 19:41:47.542416+05:30');
INSERT INTO public.activation_keys VALUES ('d3f385bd-714c-4f50-82d6-ef0f4bc7b0e9', 'EDOVA-D2YN-5E7S-6F6F', '5f0d4f7d-f9b7-4327-876b-4cbf33a03c0b', 25, 'ACTIVE', '2027-08-24', '2026-08-27 21:54:14.842967+05:30', '2026-08-24 16:59:22.932333+05:30');
INSERT INTO public.activation_keys VALUES ('ef32d0df-2831-4f06-b61f-b059b84ebcce', 'EDOVA-7GRW-9GRM-83BN', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 20:58:56.480958+05:30', '2026-09-10 20:58:56.417496+05:30');
INSERT INTO public.activation_keys VALUES ('96b6503e-3f17-4fc6-913a-fbcfaeaa2e93', 'EDOVA-BTU9-3KHB-7EAP', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 20:39:12.116648+05:30');
INSERT INTO public.activation_keys VALUES ('de33f86a-399e-41c3-bcfc-aebbb2c4c25d', 'EDOVA-2026-TIER-FOUR', 'cc18849d-5fe6-496b-bf04-ce1c19e5146d', 50, 'ACTIVE', '2028-12-31', '2026-08-27 22:02:11.379886+05:30', '2026-08-27 22:02:03.299675+05:30');
INSERT INTO public.activation_keys VALUES ('ae665235-91d9-4ef0-a3be-55a6e8b2807c', 'EDOVA-RF3P-3Z6W-EPTQ', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 20:02:01.196549+05:30');
INSERT INTO public.activation_keys VALUES ('70febf24-2302-4d0f-b87a-86f23c59ef59', 'EDOVA-DMPE-2G4X-EAJ9', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 21:02:38.95818+05:30', '2026-09-10 21:02:38.893077+05:30');
INSERT INTO public.activation_keys VALUES ('fb725c05-804d-461d-b052-9b1d3e315883', 'EDOVA-K52F-BJ6W-C3QR', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 20:03:05.986642+05:30');
INSERT INTO public.activation_keys VALUES ('a81ae86d-785b-412d-a6e3-b5fa4d8a61de', 'EDOVA-SSPY-JJGW-T8D8', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 21:05:26.118434+05:30', '2026-09-10 21:05:26.056029+05:30');
INSERT INTO public.activation_keys VALUES ('386226db-2996-47ee-b746-0c7eeea9463d', 'EDOVA-8TRB-4AJK-R88Z', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 20:44:27.915692+05:30');
INSERT INTO public.activation_keys VALUES ('757cc2fd-4f41-4395-95c0-1ac2d46009e6', 'EDOVA-J9CZ-JVFQ-99WH', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 21:05:40.574918+05:30', '2026-09-10 21:05:40.51217+05:30');
INSERT INTO public.activation_keys VALUES ('9b5f71ab-4610-4910-85db-aaeedf47aaa2', 'EDOVA-3F7D-KDGY-BD82', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 20:46:14.337786+05:30');
INSERT INTO public.activation_keys VALUES ('3c91590c-e1f4-435a-9f34-19609b0b7ed8', 'EDOVA-2J8T-G5QF-BJ7Z', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 20:55:59.132234+05:30', '2026-09-10 20:55:42.753341+05:30');
INSERT INTO public.activation_keys VALUES ('49510500-d462-4b49-b257-3a12897a6031', 'EDOVA-FCHU-RGR6-MRQ7', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-11 07:44:08.545601+05:30', '2026-09-11 07:43:56.967137+05:30');
INSERT INTO public.activation_keys VALUES ('5d76a5b2-ee45-4a23-884b-6dc4c38b47bf', 'EDOVA-335M-ZY6Z-26F5', '79beb589-b7fb-43ef-8b9b-e3ea05916de1', 1, 'UNUSED', '2026-08-11', NULL, '2026-09-10 21:07:10.721875+05:30');
INSERT INTO public.activation_keys VALUES ('ecfb17e6-bb91-46a8-981d-18e754bb6315', 'EDOVA-J64Y-HKA4-9ECZ', '695bb538-44f6-46a4-8708-bfbab0491750', 2, 'REVOKED', '2026-10-10', '2026-09-10 21:07:09.112783+05:30', '2026-09-10 21:07:08.68441+05:30');
INSERT INTO public.activation_keys VALUES ('c99c2ea7-d706-4870-8eee-027f3da0c1e3', 'EDOVA-263R-K9PF-QK9A', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 1, 'UNUSED', '2027-12-31', NULL, '2026-09-10 21:07:12.33556+05:30');
INSERT INTO public.activation_keys VALUES ('27fb4de7-294f-439c-9ff2-ca1788472205', 'EDOVA-EXP0-RED0-TEST', '695bb538-44f6-46a4-8708-bfbab0491750', 1, 'UNUSED', '2026-09-09', NULL, '2026-09-10 21:07:12.63495+05:30');
INSERT INTO public.activation_keys VALUES ('f7230295-76e4-464e-89aa-f2c719c56f56', 'EDOVA-MS8F-UAKM-D5JC', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-10 21:07:26.206809+05:30', '2026-09-10 21:07:26.144278+05:30');
INSERT INTO public.activation_keys VALUES ('756c5925-8376-4dd4-b613-c70b80faf283', 'EDOVA-4966-8FS7-MKAK', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-11 07:29:35.469996+05:30', '2026-09-11 07:29:35.292416+05:30');
INSERT INTO public.activation_keys VALUES ('4d7356ae-ef07-487b-90f8-9294123a2453', 'EDOVA-ZTHY-D82R-BMZ4', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-11 07:41:07.18958+05:30', '2026-09-11 07:40:49.501008+05:30');
INSERT INTO public.activation_keys VALUES ('72d9a49a-53b9-4588-be95-30f29fb350f4', 'EDOVA-HBTF-2RUM-77MS', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 1, 'ACTIVE', '2027-08-28', '2026-09-11 07:45:21.158019+05:30', '2026-09-11 07:45:19.744647+05:30');


--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admin_audit_log VALUES ('4fe73062-3818-46ec-a323-3c43ddcc607d', '2026-08-12 15:38:45.292248+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c60aed22-7004-4418-a324-8bec277edd5c', '2026-08-12 15:38:45.874003+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d1a50df2-0a65-49bf-9200-735f520cfc43', '2026-08-12 15:38:46.465443+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('aeb6a829-7a14-4b63-bc6b-29c2188b8199', '2026-08-12 15:38:48.037797+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/f151f30c-dcb2-407c-9a26-f57bdf088598/quiz-config', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0bb10bc0-2f86-49e6-b09c-e9deb2f5b475', '2026-08-12 15:38:48.570299+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e5ba5392-76c5-451b-8860-9cde6bc44dc2', '2026-08-12 15:38:49.114931+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/subjects/894968a6-463a-4b3b-a3fa-3ce0b36ce41a/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f6239608-0723-4de0-bfa0-1cb111c961f7', '2026-08-12 15:38:49.677466+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/6dedd196-73c8-42f8-a7ba-3218633966da/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c1d6800b-65db-4d31-a177-c59b76c34ce6', '2026-08-12 15:38:50.263184+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/f6536e82-a96d-4a6e-aae4-95209b006a12/quiz-config', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('17bb399b-66fc-497d-b23f-5150f434b349', '2026-08-12 15:38:50.83541+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/c736b2d0-12a4-4d0f-ac1d-55fb8c0c7a34/quiz-config', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('546a5315-8709-487f-af83-4a3aad2d4c52', '2026-08-12 15:38:51.370088+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/6dedd196-73c8-42f8-a7ba-3218633966da/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ec2df91c-c8c5-4fbb-8efb-be601e7fc7e6', '2026-08-12 15:38:51.904391+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/6dedd196-73c8-42f8-a7ba-3218633966da/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e4eb1fbf-4e95-46d6-ac4c-ce2110a1bcf5', '2026-08-12 15:39:58.89096+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6fe35162-99bb-469f-90fa-dabb35f0ffab', '2026-08-12 15:40:54.802717+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('73f11ecd-f278-495b-a8c8-a615fee8bc72', '2026-08-12 15:40:55.884938+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/1ba6b0dc-b20e-45de-b8b4-11252007568c', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7bed6686-3be6-489d-9185-e477817880ca', '2026-08-12 15:40:57.265889+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('175bbf45-8237-4e3f-9fa4-2d2e25572921', '2026-08-12 15:43:03.033838+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ab87a60b-f86c-4864-b577-63312a06f3df', '2026-08-12 15:43:03.511048+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('87f000ea-f91b-4bf2-b0a9-d11099c9d128', '2026-08-12 15:43:04.528094+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/084a3dae-fc99-419c-aca7-a03c93f1504a/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7afdfbe1-6760-4371-a582-649857b93116', '2026-08-12 15:43:05.001618+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/084a3dae-fc99-419c-aca7-a03c93f1504a/subscriptions', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('50f74192-61b0-431e-bcd9-bb5552416cd5', '2026-08-12 15:43:06.474084+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6f585ad5-dd25-422f-aab8-2a829df64274', '2026-08-12 15:43:06.993582+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 409, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('890e8bd2-5a22-48e6-8ee6-bd58ecb387df', '2026-08-12 15:43:07.492383+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('df9db0ac-02ea-42a1-8c29-5c9c39274a80', '2026-08-12 15:43:08.384341+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('efcf8974-3c72-456e-aa9c-1e39e8c15596', '2026-08-12 15:43:10.687449+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('90ae1d5c-3f02-44f8-809e-e923601a6b13', '2026-08-12 15:43:11.19076+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/c53a7d0f-3019-46e9-924e-e66a36021139/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0af83464-524c-43fd-b649-85f6c7e72ce5', '2026-08-12 15:43:11.69889+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/c505a331-8723-490b-8e12-9e6a727f363c/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('617d4859-bd0f-4bed-a597-34ea2ddf593f', '2026-08-12 15:43:12.242428+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/c505a331-8723-490b-8e12-9e6a727f363c/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9cef3da1-4271-474e-a4e0-4dacfaca7ebb', '2026-08-12 15:43:12.79017+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/c53a7d0f-3019-46e9-924e-e66a36021139', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5fa5605f-47a0-4fc1-9a00-4d545e9974b4', '2026-08-12 15:43:13.319666+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/c53a7d0f-3019-46e9-924e-e66a36021139', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c59531a4-9dce-44e3-9743-fc59df516cef', '2026-08-12 15:43:13.901362+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/c505a331-8723-490b-8e12-9e6a727f363c', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8ab0d9c3-f73f-4798-aa3c-8c1c3fee1633', '2026-08-12 15:43:17.792366+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users/99dd1f5c-9fdc-4943-9b33-cce71f93663e/password', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cc3361a9-61b3-454d-80d1-0fb49b687234', '2026-08-12 15:43:33.350302+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/44282af8-9512-493d-acba-c837f9292abe/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('05dcf136-8e63-446e-bb5b-4f6376baecee', '2026-08-12 15:43:33.917283+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/44282af8-9512-493d-acba-c837f9292abe/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('53bd20b5-910e-4762-af5a-9743afd0724f', '2026-08-12 15:43:34.477506+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/44282af8-9512-493d-acba-c837f9292abe/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a171ac0d-b31e-49f9-841c-a24e15221e4c', '2026-08-12 15:43:35.148072+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/44282af8-9512-493d-acba-c837f9292abe/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b223c279-0bc1-4c7b-85cc-422517d67dc8', '2026-08-12 15:43:35.8129+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/44282af8-9512-493d-acba-c837f9292abe/modules', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ec16f5fe-9169-4e2b-bdbf-0666145b1ed7', '2026-08-12 15:43:37.008873+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/a4b62c3b-ef15-4b25-b205-c99219dc8609', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('187a8358-13de-402e-b4a3-c32bd6265b15', '2026-08-12 15:43:37.675758+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/1ba00ce3-79d2-4197-a60e-42146f1d25a6', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a6b376dd-622e-4d7c-a40f-e17701dd5e1d', '2026-08-12 15:43:38.925069+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/topics/57e2445c-5090-4d5b-934f-1e9a296db0e7', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c67b85db-6730-40ad-8831-65a378e877d4', '2026-08-12 15:43:40.242935+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/topics/57e2445c-5090-4d5b-934f-1e9a296db0e7', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('385cd7b3-a780-4777-a6fa-5cc51d66e0d4', '2026-08-12 15:43:42.253538+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/44282af8-9512-493d-acba-c837f9292abe/topics', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ab06efad-5490-46ac-aa9a-7f0d65120aa5', '2026-08-12 15:43:42.771602+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/topics/fe03f53d-321e-4f99-9c85-c2c728305464', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6ee0f0ee-22ec-41a5-ab8f-a81aebaae128', '2026-08-12 16:01:52.504411+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5c472d4a-2f59-4507-bede-a747d4829e88', '2026-08-12 16:01:52.834438+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b07ebc32-d255-495f-9fdd-3b2f547ee6d7/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c71f4fe5-630c-4918-93d4-5c7130216588', '2026-08-12 16:01:53.130828+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b07ebc32-d255-495f-9fdd-3b2f547ee6d7/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('992e3974-6d6d-4bc9-b9cb-73ed158c4623', '2026-08-12 16:01:55.458365+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/d55fcf19-d65b-4cef-8b7f-d3b5cbd03f4b/lab-upload', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('deb9a291-40c5-4462-a56b-e9027a7cdbd2', '2026-08-12 18:56:17.659993+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/c9e1f696-d3a8-4c7c-abdc-7bd2168a0c71/lab-upload', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3c65925f-a742-45d0-8f07-71588a3b7f2b', '2026-08-12 18:56:19.41392+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/c9e1f696-d3a8-4c7c-abdc-7bd2168a0c71/lab-upload', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a6cebc49-63cf-443b-b6b3-caabbe7921ba', '2026-08-12 19:26:51.563219+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/fff653c7-0029-45f2-897c-586de430efe7/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cb13e066-5675-42f6-b7a8-3b548c2330a1', '2026-08-12 19:27:18.829999+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e79156e4-be76-42bb-a467-e41905903b52/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f2ef3e7a-aa8d-400f-ba36-663368d8c286', '2026-08-12 19:28:11.259967+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e79156e4-be76-42bb-a467-e41905903b52/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b9409f72-ed5a-4b57-872f-2d58714d744e', '2026-08-12 19:29:52.263147+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e79156e4-be76-42bb-a467-e41905903b52/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4bc45ae0-dde7-44cb-ae4e-2cdc97381cee', '2026-08-12 19:34:03.285469+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e79156e4-be76-42bb-a467-e41905903b52/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('96f8b63e-55dc-41ba-aea2-a9f15e1db408', '2026-08-12 19:46:12.46741+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/424692a8-cb70-4204-b51f-427aaade2709/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('be446606-0fd4-4909-8fd2-fc41c5b82f2d', '2026-08-12 20:15:48.948793+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/1ba6b0dc-b20e-45de-b8b4-11252007568c', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d2a71250-526d-4007-ad21-319e5e71143a', '2026-08-12 20:15:49.642726+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('356376f0-6f1f-4497-8313-5002fb7a250e', '2026-08-12 20:15:50.289869+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bc1d6eb8-6c44-4696-9068-7bac32952b89', '2026-08-12 20:15:50.93636+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2d7f8557-512e-4744-b4a3-a5585a06c862', '2026-08-12 20:15:51.59349+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ec9dd9df-1e09-4381-82e1-5510c1df0c50', '2026-08-12 20:15:52.225696+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('61de53a5-9fa8-4d10-a7dd-81645c98f345', '2026-08-12 20:15:52.917276+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3f7b5c6e-71b2-4ca1-8fd6-cca891a4e1d7', '2026-08-12 20:47:00.576054+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b07ebc32-d255-495f-9fdd-3b2f547ee6d7/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('45816cbd-7ee9-43e0-8c69-caaebd85e741', '2026-08-12 20:47:00.884825+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b07ebc32-d255-495f-9fdd-3b2f547ee6d7/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ff8beec1-afa8-481a-ba89-1b8413ada429', '2026-08-12 20:47:24.814006+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/f000dedf-7f9f-4b00-ab9c-f1cbc93d8ee4/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a5ed542c-1b40-4d82-a619-9e4538e80f46', '2026-08-12 21:25:44.635655+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('594d419e-11e3-4198-ad8a-3043b3ae7fbf', '2026-08-12 21:27:52.105695+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b86864b4-2e43-44e6-983c-3f0f0db5317b', '2026-08-17 12:44:29.485568+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d51b4945-661b-474d-8e64-5d139bd56b8c', '2026-08-17 12:51:57.977897+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bf207dc2-921b-4d6e-8b14-fbf32641dfa1', '2026-08-17 12:51:58.221712+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/30b43bc5-8c9f-474b-9b82-6279eb1ec027', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('87add687-d1e4-476b-a94f-62442056f827', '2026-08-17 12:51:58.462327+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('70878d51-229d-4bc6-8470-975a81483bc2', '2026-08-17 12:51:59.917385+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/30b43bc5-8c9f-474b-9b82-6279eb1ec027', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2547a404-8e02-4b4f-b5ac-fe55a9df6fea', '2026-08-17 12:52:00.142796+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b76e712c-0bbb-4b6f-8730-e9b9cd7a0e3b', '2026-08-17 12:52:00.513072+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/30b43bc5-8c9f-474b-9b82-6279eb1ec027', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ffffc66a-c450-4e7a-884a-abe04f9729d7', '2026-08-17 12:52:05.156047+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a129aa35-82f1-4b3e-a7c9-9a1b0220fb7f', '2026-08-17 12:52:05.395666+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a61d750c-4b59-48c3-8c6c-9b3751931c6f', '2026-08-17 12:52:05.653811+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2fce08cc-25fb-4018-8e86-0d0f21f3d2e7', '2026-08-17 12:52:15.206702+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('26db3109-0aa7-4194-a4d2-3cc195376780', '2026-08-17 12:52:15.441358+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('057592a0-2e00-49dd-80cc-68f1aa17e089', '2026-08-17 12:52:15.683271+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('36d49d12-e3b2-4dca-953e-db1479a4d551', '2026-08-17 12:53:08.945712+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('227afcb8-5b6d-43f9-9447-e94c7ed4fe64', '2026-08-17 12:53:46.036941+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/2fe6f388-1713-4294-9153-c4744eb10b0e/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('13dcee84-4edd-4e6d-8c53-809f078f123b', '2026-08-17 12:54:29.757343+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e24bc901-49b6-491d-9c8b-ae70d2a49efc/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('73adccc2-84c2-4c1e-a38d-a3b24a5b69b9', '2026-08-17 12:58:43.790804+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e24bc901-49b6-491d-9c8b-ae70d2a49efc/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8b41afa1-d957-478f-9cf5-3a4b0d121f12', '2026-08-17 13:32:28.202459+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/e24bc901-49b6-491d-9c8b-ae70d2a49efc/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('72623387-0b29-422d-a279-668af0c6fc42', '2026-08-17 13:32:35.935755+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/e24bc901-49b6-491d-9c8b-ae70d2a49efc', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6b98a76c-5e53-44b7-b220-593818b0a0c8', '2026-08-17 13:36:28.458883+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/3dd28239-e8fe-439f-b2cb-653334448acd/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('36ff6553-ac5d-4cf8-931a-8c77f5c8d8cb', '2026-08-17 13:51:07.717249+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3715f0b3-843c-4c32-837d-d44f27f23200', '2026-08-17 13:51:29.65622+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/3dd28239-e8fe-439f-b2cb-653334448acd/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2e7f4211-f51c-46c4-9893-264578d2e6e2', '2026-08-17 14:01:09.065874+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c1f11ece-49ce-4498-b605-4c905e6c44cf', '2026-08-17 14:01:09.167071+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e78526d9-34e1-4118-8c1a-90c7a434d135', '2026-08-17 14:01:09.268517+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('289d927b-e734-4793-8a86-80303ff91456', '2026-08-17 14:01:09.578352+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cf82874c-3aa8-4769-ae37-aef2419348be', '2026-08-17 14:25:41.546373+05:30', '07e9622f-7ede-43d3-b0ba-e174b2e13b96', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9e1e7875-45f3-445e-831f-29e008faf2f8', '2026-08-12 15:43:16.003869+05:30', NULL, 'PATCH', '/admin/subjects/c53a7d0f-3019-46e9-924e-e66a36021139', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('00581637-aaf7-4e5c-a75a-814d09050776', '2026-08-12 15:43:16.502863+05:30', NULL, 'POST', '/admin/tenants', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6aab8043-5407-408e-82ac-ffecc15edbb5', '2026-08-19 13:25:37.182752+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fcdace64-0d82-4928-b4d8-304baea22faa', '2026-08-19 13:25:37.498691+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4ba4cb69-2f30-4919-bf39-04f1a4f0f8d9', '2026-08-19 13:25:38.525238+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/c719d4c0-94cc-49fa-8b0a-6ac948c8e53e/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4e2aea7c-c112-449b-b68d-a95dc930b249', '2026-08-19 13:25:39.031134+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/c719d4c0-94cc-49fa-8b0a-6ac948c8e53e/subscriptions', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7c1b3da6-790b-43c4-b53a-539747bb081e', '2026-08-19 13:25:40.644881+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b0312cf0-4426-4b51-a041-878ef9cec27b', '2026-08-19 13:25:41.253978+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 409, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5486bae8-4a9a-41e7-9832-e9157d787998', '2026-08-19 13:25:41.785283+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('79c14aa0-8c06-4ebf-9af0-763f060b9cb8', '2026-08-19 13:25:42.631669+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fa0da94d-39b8-4291-a2c8-6bb08059f463', '2026-08-19 13:25:45.167394+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('39ccdaa7-dfe7-4aea-9fee-b14a8af9df4c', '2026-08-19 13:25:45.79471+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/dff4c595-4967-4f94-ae21-58a1368b9a0a/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cf66b2ba-4ef1-40c9-a8d7-fd08e8d486d7', '2026-08-19 13:25:46.411809+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/d8bd060a-9b1d-46a8-98ad-097bc609b79a/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a29eae82-c398-460c-a161-d7427f79ee71', '2026-08-19 13:25:47.0043+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/d8bd060a-9b1d-46a8-98ad-097bc609b79a/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('23b5cc0a-ec21-47bd-9bb7-d918f282e21e', '2026-08-19 13:25:47.59222+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/dff4c595-4967-4f94-ae21-58a1368b9a0a', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5a21ca42-b178-4142-a888-5186f2f54c49', '2026-08-19 13:25:48.214037+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/dff4c595-4967-4f94-ae21-58a1368b9a0a', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('105c6855-8eaa-4cdf-865f-058882a505a7', '2026-08-19 13:25:48.814957+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/d8bd060a-9b1d-46a8-98ad-097bc609b79a', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('71685887-b914-4c81-b4f0-be479a303db6', '2026-08-19 13:25:53.029163+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users/556cf3b9-436a-4b06-b9fd-4c99111c5d66/password', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f84551c0-197e-426d-bb45-b730ef684d49', '2026-08-19 13:26:16.88349+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/304bc7a6-af61-42ee-a3d4-3b3e83bc1f7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c1211796-66b6-4691-ab16-180898693252', '2026-08-19 13:26:21.303955+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/bee8bc23-84c2-426f-9657-b8f12aaa82cf/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5a36cd0d-7f92-41e9-ae17-5c6d02ca3bd8', '2026-08-19 13:26:23.012668+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/9300f804-f485-4584-a084-1e149f9d4d3e/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('968ea4ab-bd03-47e2-ba94-16396e8dc552', '2026-08-19 13:26:25.209837+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4d8e0dd8-d24f-4f4c-ae24-ee26c74215e4', '2026-08-19 13:26:25.760526+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/304bc7a6-af61-42ee-a3d4-3b3e83bc1f7f/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9fc70711-31c7-4cc7-a65b-4329a1ad92ca', '2026-08-19 13:26:39.585229+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/a0f02a96-79a9-4923-8d6b-f009befb7669/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('13187a90-7da8-455b-b226-b58d47964efe', '2026-08-19 13:26:40.032978+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/a0f02a96-79a9-4923-8d6b-f009befb7669/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eac7b982-21a7-4cbb-8469-01a4d4ebb89b', '2026-08-19 13:26:40.653549+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/a0f02a96-79a9-4923-8d6b-f009befb7669/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('72587cb7-a42b-4723-bb7d-76bbb4c8aba0', '2026-08-19 17:47:23.499859+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3bd32fdc-f014-460d-b7c5-c7b0de2300fb', '2026-08-19 13:26:41.383872+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/a0f02a96-79a9-4923-8d6b-f009befb7669/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bd0618bf-543b-4810-8de4-082aa8c2236a', '2026-08-19 13:26:42.017948+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/a0f02a96-79a9-4923-8d6b-f009befb7669/modules', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('13d596e5-37ae-4d78-9470-8fb880ae8ff1', '2026-08-19 13:26:43.220739+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/227cbe41-9623-494a-b286-80e18cd1696e', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7cd09e25-370a-431e-bc88-3a14d304cc69', '2026-08-19 13:26:43.778919+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/9436dfc2-d159-46a9-898e-de0a609911e8', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ac8a48e4-27a6-4679-96a2-bd8f9c13b71d', '2026-08-19 13:26:44.710101+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/topics/ef19236f-a29f-4135-a0c5-ab80fe5778e2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b8bbedf1-0397-44d4-afcc-8e30c6d14dbb', '2026-08-19 13:26:45.717036+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/topics/ef19236f-a29f-4135-a0c5-ab80fe5778e2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('72f707f7-75fd-4159-888e-a2d026f8d885', '2026-08-19 13:26:47.496183+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/a0f02a96-79a9-4923-8d6b-f009befb7669/topics', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('08c1cc0f-3783-4a16-be99-3e97281ce647', '2026-08-19 13:26:48.029202+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/topics/72e06820-0547-41b4-b445-c16612f001de', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('80e29d48-29ef-4dcb-924e-9550c7ffff59', '2026-08-19 13:26:50.492327+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('045d5b26-875a-4c9c-91f2-5a39d71d6227', '2026-08-19 13:26:50.830002+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/a0cb3d59-9d07-4704-9173-dcc0d313cea9/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eb139371-c1fd-465f-997c-0355efa59f9e', '2026-08-19 13:26:51.160293+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/a0cb3d59-9d07-4704-9173-dcc0d313cea9/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5ee4bac2-88ad-45d4-9d80-87df809418bd', '2026-08-19 13:26:51.621951+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2bafddba-e956-4842-8f4b-f5add1c0528d', '2026-08-19 13:26:52.143338+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/12eae830-30e6-414a-9134-ae16bb08fc60/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e857ab83-2ccb-4c06-9a3a-1b2f063138f5', '2026-08-19 13:26:52.669985+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/3c8a4202-ba69-452b-b5bd-41ad96e85038/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('63a40700-3954-4234-b58e-34abc29ff356', '2026-08-19 13:26:53.192248+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/2969e9b8-c38f-44d3-963d-cc55e06560b8', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('746cc37d-8195-4dc2-aaa0-d94d8e146c9f', '2026-08-19 13:25:51.123344+05:30', NULL, 'PATCH', '/admin/subjects/dff4c595-4967-4f94-ae21-58a1368b9a0a', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('abd08f3a-1ce6-458d-bf3f-46302d09b2f8', '2026-08-19 13:25:51.626947+05:30', NULL, 'POST', '/admin/tenants', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7b9fe567-89c9-4560-ad1a-e87fac374eb4', '2026-08-19 13:28:43.28899+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4008132c-439e-4572-9c7c-1836dc7215d4', '2026-08-19 13:28:43.614426+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('739bf069-4537-4542-8d65-a0b6b8eb6b97', '2026-08-19 13:28:44.388572+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/ee3f1fe6-6cec-4349-96af-20dbc55623cd/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8ce63e93-49c8-4ee2-bd33-6aa1e2be92cc', '2026-08-19 13:28:44.909304+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/ee3f1fe6-6cec-4349-96af-20dbc55623cd/subscriptions', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0f841b3e-dde4-49e6-aa72-cb9a0b8266fa', '2026-08-19 13:28:46.325202+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1dc6d8f8-e43d-4179-b17b-c4a8514c5418', '2026-08-19 13:28:46.931472+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 409, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b1ad0cd7-4f83-47d0-8769-1c8033aeed4d', '2026-08-19 13:28:47.508086+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e7fc6b9c-6185-425b-8c5c-12ce9bb2024c', '2026-08-19 13:28:48.367315+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fc47dd35-803e-43ac-ae53-2044bf3ddcb1', '2026-08-19 13:28:50.888604+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('69803a63-cd5e-4971-8cf0-80178e562740', '2026-08-19 13:28:51.487373+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/d1503c00-aaec-49e2-a188-5787398b9208/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6f143ee1-834e-4fb5-96c4-9fc21500ca4e', '2026-08-19 13:28:52.138727+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/43ebc8d5-8d05-41c4-a576-0ef757ae3df2/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3f76a34a-f761-4f6f-9e05-1ed260c0a6df', '2026-08-19 13:28:52.820832+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/43ebc8d5-8d05-41c4-a576-0ef757ae3df2/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cd4c7a48-710f-4692-bf55-2705b1f79b5c', '2026-08-19 13:28:53.409378+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/d1503c00-aaec-49e2-a188-5787398b9208', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('973238e1-0d4f-460f-b551-9965d7d6ac20', '2026-08-19 13:28:53.971614+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/d1503c00-aaec-49e2-a188-5787398b9208', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1fc2dfe3-29d1-460f-a299-b0ae91f9579e', '2026-08-19 13:28:54.539438+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/43ebc8d5-8d05-41c4-a576-0ef757ae3df2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c9c05082-95c3-4227-b1fe-77e63835423e', '2026-08-19 13:28:58.844693+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users/79e235ed-beaf-455e-9ecb-e5ced5e7e397/password', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f01f0c03-20c5-4ba7-a18b-011b9372cf3d', '2026-08-19 13:29:22.220038+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/de24b3e1-6f75-4cbd-8954-c9f599c27f0b/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3131882f-0147-49a1-a3d1-beb479250233', '2026-08-19 13:29:26.51896+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/7fb06edc-b3be-407b-aec7-714f087e5c90/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3e39d12a-9a39-4018-9d10-0bb3b7e4a77e', '2026-08-19 13:29:28.401002+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/dbbada87-fe40-42c9-a92f-4302e31e2312/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('360200fc-f75e-43e2-854c-4b93ca16c66d', '2026-08-19 13:29:30.378427+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('497efcdf-c5c2-4c8c-beea-7f891aa4c57d', '2026-08-19 13:29:30.901489+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/de24b3e1-6f75-4cbd-8954-c9f599c27f0b/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cb7759e8-cf96-4be4-9311-a21617aa39b2', '2026-08-19 13:29:44.734486+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/af78f732-6915-4502-a0af-e2f0bce4ad06/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f15c4638-9d4c-4ac8-b6b2-0117eb477988', '2026-08-19 13:29:45.300976+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/af78f732-6915-4502-a0af-e2f0bce4ad06/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8f7d9cbc-c7a1-4502-9af4-530abef34db0', '2026-08-19 13:29:45.947598+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/af78f732-6915-4502-a0af-e2f0bce4ad06/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7ee84661-1710-4648-a7af-6478e8b04fb2', '2026-08-19 13:29:46.555162+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/af78f732-6915-4502-a0af-e2f0bce4ad06/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a2ee9f50-eb13-4f34-a2a9-3ee58a9eed1f', '2026-08-19 13:29:47.164209+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/af78f732-6915-4502-a0af-e2f0bce4ad06/modules', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b83573d7-3d44-4deb-a89a-484afcf35ca1', '2026-08-19 13:29:48.441868+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/d15f573a-55ff-470a-9ad9-c90da7f542ef', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('79de19c0-1618-4f30-b64a-bece27917b65', '2026-08-19 13:29:49.022818+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/b7af3370-ad8a-4bdf-8c16-f4eb5076fab9', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('641675fe-58d7-425b-aa97-e6d23e0da111', '2026-08-19 13:29:50.167149+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/topics/e0614356-8ae2-4f6e-a3f7-d84f274c9237', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c97051f8-7343-4930-93c4-65174a3d644a', '2026-08-19 13:29:51.369114+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/topics/e0614356-8ae2-4f6e-a3f7-d84f274c9237', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a754ac5c-2038-4ad9-9a60-271be51d05f0', '2026-08-19 13:29:53.188857+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/af78f732-6915-4502-a0af-e2f0bce4ad06/topics', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a90b1f6d-31d9-4ace-973a-ca17da77a865', '2026-08-19 13:29:53.687003+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/topics/8204caf6-724e-4ed8-8003-70c5bc3a3f4c', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a7b62276-833d-47cb-a4bf-78372acc8325', '2026-08-19 13:29:56.265984+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0a9b051f-f852-4dba-93ea-df97cd4ca40b', '2026-08-19 13:29:56.626024+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/f56b6b68-fea1-4dee-8859-424e69bc1eae/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('44ea01c6-8d58-4793-a5d5-d864aed4366a', '2026-08-19 13:29:56.972125+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/f56b6b68-fea1-4dee-8859-424e69bc1eae/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('01f13a88-a67c-4bdb-ba08-97d21b7a9a2d', '2026-08-19 13:29:57.609765+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0cf23d20-8f69-4abb-9be9-78f399d74a3f', '2026-08-19 13:29:58.179801+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/168a3416-c402-4083-91c3-805965f74343/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7d50731a-037f-4ada-b379-49a199f90576', '2026-08-19 13:28:57.376672+05:30', NULL, 'POST', '/admin/tenants', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9f6692ce-cf85-4186-955c-460ccab12fcb', '2026-08-28 23:09:05.648152+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9b0e0149-3b45-4ebb-aa9b-19f23f944743', '2026-08-29 10:16:59.905108+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ee64aca0-7d53-41dc-b320-db548d31b76e', '2026-08-19 13:29:58.810864+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/90b10d0d-da44-427a-b0af-7aa073ce01b1/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9d29df66-5ed8-4890-91fb-e4b125be7cbd', '2026-08-19 13:29:59.390279+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/0b631a05-0b8a-4e04-aa87-d9187c42cef6', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('09b14c8e-6b84-4a11-8bd5-3e350b0e65a9', '2026-08-19 13:28:56.840838+05:30', NULL, 'PATCH', '/admin/subjects/d1503c00-aaec-49e2-a188-5787398b9208', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('467f4b50-af47-4c2e-8793-18a91810808f', '2026-08-19 17:47:23.780533+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b182ae56-aa30-451d-8fbb-67a41dec7363', '2026-08-19 17:47:24.397023+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/430bf804-02b9-4f20-94c8-59d6304d7663/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6ef0f9c6-b0bc-496e-a821-93b6b56a0a19', '2026-08-19 17:47:24.905262+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/430bf804-02b9-4f20-94c8-59d6304d7663/subscriptions', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('294e4d33-a2af-4079-b8ce-db190a9078de', '2026-08-19 17:47:26.216014+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cba5e9e7-a3b0-405c-8742-eda616d7a35e', '2026-08-19 17:47:26.757354+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 409, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c50e3e84-cd63-4cda-88b7-316396e2db8c', '2026-08-19 17:47:27.227718+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6e92f864-aca3-4309-8008-fa3e4b3d684e', '2026-08-19 17:47:28.077382+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b8aa9f1b-87c2-40ac-b5fb-cdf2643009af', '2026-08-19 17:47:30.391278+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c6e64152-9c2d-4fc7-b9a0-7881d1de39cd', '2026-08-19 17:47:30.90429+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/a2af8a97-5b7b-4415-9374-cf1214c9b03c/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0625d9ea-8623-42bc-92fd-36d9822edc54', '2026-08-19 17:47:31.463876+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/92a119e5-1f01-4ed8-8ff7-a04c1674349d/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7481f237-f80b-4f0c-a189-ecd4bccd144e', '2026-08-19 17:47:32.031785+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/92a119e5-1f01-4ed8-8ff7-a04c1674349d/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f46d2d10-a09e-435b-bb15-31e89d2faa46', '2026-08-19 17:47:32.551951+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/a2af8a97-5b7b-4415-9374-cf1214c9b03c', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7ea5be72-0af4-4aff-8d47-80ea10ba1536', '2026-08-19 17:47:33.065086+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/a2af8a97-5b7b-4415-9374-cf1214c9b03c', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d68aed75-ec44-4bee-8118-a5c54b751cac', '2026-08-19 17:47:33.61386+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/92a119e5-1f01-4ed8-8ff7-a04c1674349d', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('16cc6ead-8f37-4b9c-a794-332b5c8efca6', '2026-08-19 17:47:37.591918+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users/4dcd97d1-ab31-4b9a-8df8-20761ae95324/password', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f02a96b3-7408-4d2b-b597-138420271190', '2026-08-19 17:47:59.107188+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/fb048161-e34d-4b38-9f94-e677854f08e3/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('75234a5b-b15a-4310-9d1a-2246041c2e4b', '2026-08-19 17:48:02.753966+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/a6e257c2-4b48-4114-a36f-a238bbc5c2c3/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e67f3a64-13cf-4542-a9f6-0b678f05a4cd', '2026-08-19 17:48:04.202059+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/c34b670c-ba02-44cd-af65-f2cdd540aaec/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e73aa8d5-6722-49b0-8f9d-49200aee0d24', '2026-08-19 17:48:05.845994+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('43ea07e3-6de1-47e6-a6f4-a1da4a3f7489', '2026-08-19 17:48:06.277185+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/fb048161-e34d-4b38-9f94-e677854f08e3/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7f2108d7-ce69-4ec7-b0c8-9d7ccc084edd', '2026-08-19 17:48:19.167481+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/bdcb0041-2544-4f82-ad42-055521d260c4/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c76a0493-5bd8-4a1b-a723-0613cc33c95a', '2026-08-19 17:48:19.577478+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/bdcb0041-2544-4f82-ad42-055521d260c4/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d4c05f38-70d9-42b4-bf29-4fe21f720c5b', '2026-08-19 17:48:20.13302+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/bdcb0041-2544-4f82-ad42-055521d260c4/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ee143827-471a-49c3-9b54-d1866690710d', '2026-08-19 17:48:20.637837+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/bdcb0041-2544-4f82-ad42-055521d260c4/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('37ee9dbb-1fe9-436d-aa0e-6197429acae1', '2026-08-19 17:48:21.209041+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/bdcb0041-2544-4f82-ad42-055521d260c4/modules', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('70d7d44e-15d0-4ca1-b740-b4bc1f2789fc', '2026-08-19 17:48:22.272538+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/f42af8d9-f511-442f-9c22-ee4cda6ac5e5', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fcbcafa9-bece-444a-af89-3feef9711fb8', '2026-08-19 17:48:22.939487+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/9c216e7b-3bfb-4bee-b8c7-d34ff0f8b452', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('11643a24-cd97-4c97-9516-21896a123635', '2026-08-19 17:48:23.920517+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/topics/5310c969-2c0c-498e-9ad9-d4a354225129', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('699e09d5-209d-4670-90aa-94a08b6f7e5c', '2026-08-19 17:48:25.004087+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/topics/5310c969-2c0c-498e-9ad9-d4a354225129', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bca73ef7-1c00-4cd6-9bb4-161b8584d974', '2026-08-19 17:48:26.680972+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/bdcb0041-2544-4f82-ad42-055521d260c4/topics', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8c651a2f-39ef-4518-aa7c-ed541f8becff', '2026-08-19 17:48:27.222812+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/topics/129f46fd-0b2a-4645-b603-b46e56af4a83', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5e2f9746-c296-4b72-973e-0365370be552', '2026-08-19 17:48:29.792816+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2b054aed-b46d-42b1-a03e-231106c70050', '2026-08-19 17:48:30.146744+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/efeb9aa2-1dc9-4bb8-ae4b-ddcbe7874121/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('27369b06-003b-4cfb-b213-8166fba70c68', '2026-08-19 17:48:30.508142+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/efeb9aa2-1dc9-4bb8-ae4b-ddcbe7874121/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0d28206c-cc90-47da-ac3a-be72c84b22ec', '2026-08-19 17:48:31.084277+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9facf388-dbd7-4b91-80e3-216b3ece0753', '2026-08-19 17:48:31.598629+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/78f27baa-c976-47a8-95e7-624b5e93feb3/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6d85ab7d-17d6-4db7-afee-8b351f80f48d', '2026-08-19 17:48:32.131252+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/ba1f72f4-ec8e-4590-b881-a7ef88b48a1e/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4f7c0d19-6c20-4232-ad1f-784fb8da1c6a', '2026-08-19 17:48:32.615316+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/d1d54d50-fad0-4a01-8fcf-be13d72395a2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('50673c52-d9c5-49d5-afc5-3fb9295a62fe', '2026-08-19 18:03:37.972267+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ab4818f3-ad3c-43b1-9bcd-f6821fd43164', '2026-08-19 18:03:38.990462+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a0562323-2dc9-4ad0-944b-94a911b97f43', '2026-08-19 18:03:40.332186+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bad6af63-5dd3-4dd6-b5f0-24654082964c', '2026-08-19 18:07:49.267545+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4b992c58-e873-41ee-8ba6-e143bef77351', '2026-08-19 18:07:49.751482+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('61f53a07-4f4f-4507-bf18-6d3f01d5b0ea', '2026-08-19 18:07:50.272385+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('457825f8-b14f-4da8-b399-2536df791101', '2026-08-19 18:07:51.720734+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/c5fabbc4-31d1-4fd4-90e3-1868e7296f78/quiz-config', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d99001e3-7b1b-4ba4-b568-d8f891e3bd26', '2026-08-19 18:07:52.229953+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3865903a-7825-4faf-bfbb-79a0f6b9f9a6', '2026-08-19 18:07:52.719687+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/subjects/894968a6-463a-4b3b-a3fa-3ce0b36ce41a/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('15717aa6-0d0c-43e6-90fe-2c9b7570f36f', '2026-08-19 18:07:53.310456+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/14adbe97-5209-4363-9649-96829f14f6a1/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5a1694bc-1df4-4b78-9ab0-e1c07ceb27a0', '2026-08-19 18:07:53.916837+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/d794841f-dfa4-4fb0-8ded-301b63a3690a/quiz-config', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5d970f03-fea6-494c-a308-c96bb776f4b1', '2026-08-19 18:07:54.546075+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/2e079201-caa0-4313-93fa-7d33a9b8caea/quiz-config', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ceb64613-f17c-4b7a-b3f4-8ca8f66e0e06', '2026-08-19 18:07:55.096529+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/14adbe97-5209-4363-9649-96829f14f6a1/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a551b92d-52ed-4a25-b10c-c04172d01f37', '2026-08-19 18:07:55.631982+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/14adbe97-5209-4363-9649-96829f14f6a1/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('88a11949-de60-46e4-b6f5-ef1fb3932aab', '2026-08-19 18:08:48.51543+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('238d8fc3-4e36-481a-b363-d480fc123f06', '2026-08-19 18:08:49.598279+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f4159b0f-3b69-4857-bc7d-964d1d1df07a', '2026-08-19 18:08:50.932934+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('07c996bc-b0c3-4f93-9f21-73f7985a8add', '2026-08-19 18:10:00.293817+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e52cc1ed-2551-4fb8-b06c-41dfcda06585', '2026-08-19 18:10:01.334771+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fee117f4-b473-49ad-8d0d-68551f7757d0', '2026-08-19 18:10:02.723479+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5ccdd320-06b6-4a00-a4dc-7ebdde244938', '2026-08-26 08:39:43.478034+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/f1241a5f-9da5-4d5c-ad76-4090261c341e/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f2980812-20d6-4918-b250-8dd548a7c0d2', '2026-08-26 08:39:46.162619+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/cb861968-8ac1-42ab-99f4-75902eabece2/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('396dede9-4af3-4431-867e-29a1fb067004', '2026-08-26 08:39:47.163374+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/a410c20f-beb3-46d5-884d-5fa7560eaa3c/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6e521c14-ab8f-4af9-99b7-4e6c052102cb', '2026-08-26 08:39:48.282866+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('21b1a10b-29e3-40c3-b114-cbde373162f8', '2026-08-26 08:39:48.687122+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/f1241a5f-9da5-4d5c-ad76-4090261c341e/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1c8d76cb-0820-495b-ba72-dff7b39c6b16', '2026-08-27 20:26:28.672547+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 404, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9fa5fece-3426-4b8c-91cf-ced92045ae27', '2026-08-27 20:26:51.05408+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 404, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e6b0d236-c83f-4cf5-a28a-55c3b52273ca', '2026-08-27 20:27:42.255163+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 404, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7acc06b4-7441-4b32-b6d8-2ac144fd509a', '2026-08-27 20:27:53.212712+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 404, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('00aa1965-2412-40bc-9dfa-fba6b1ea9245', '2026-08-27 20:28:04.174289+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 404, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('65ba54d2-c7fc-4367-b16c-acc1f54fe1ea', '2026-08-19 17:47:35.658622+05:30', NULL, 'PATCH', '/admin/subjects/a2af8a97-5b7b-4415-9374-cf1214c9b03c', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e47e76f0-a66d-488e-b059-794e98aa1f2a', '2026-08-19 17:47:36.195102+05:30', NULL, 'POST', '/admin/tenants', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f8995cdd-4914-4b03-a1f8-3e1f2b594418', '2026-08-28 17:05:06.849504+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d4b20e7c-38f7-429c-838a-a4e10b5980d8', '2026-08-28 17:26:22.275052+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2d44dc52-b54a-4225-803a-d9b2095d2ca4', '2026-08-28 17:26:22.843429+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/f18dfd5d-1600-4a96-af2a-2af7bf22d5c5', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f293195b-c586-4ba3-bbdf-6be8c098cffe', '2026-08-28 17:26:23.824511+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4d0e2978-d1aa-4c96-ab58-735d200cfb8f', '2026-08-28 17:26:24.416499+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/questions/f18dfd5d-1600-4a96-af2a-2af7bf22d5c5', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5f7a684d-2e61-4e2f-adbc-8559f74f9c80', '2026-08-28 17:26:24.715669+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'DELETE', '/admin/questions/f18dfd5d-1600-4a96-af2a-2af7bf22d5c5', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ed4befc6-c6da-48a8-b082-a1e785093c3a', '2026-08-28 17:26:25.133839+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/f18dfd5d-1600-4a96-af2a-2af7bf22d5c5', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c5840d3b-8977-4e98-ad3c-a9c95bbd5c24', '2026-08-28 17:26:29.41062+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6dd19c42-69ab-4c21-ae8d-eaee8da9b8d2', '2026-08-28 17:26:29.715182+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f9dce87e-fdea-458e-a3d0-2ec0e0c3f947', '2026-08-28 17:26:30.010861+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5d60c850-f2f5-4a57-8c0a-5810818087b5', '2026-08-28 17:26:30.298243+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/6f1ca7e1-9542-49a8-92d3-c2256c922710', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0ba5128a-4da4-4008-b232-810e3a292b29', '2026-08-28 17:26:36.114876+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8c0b3283-24e7-49a0-8649-bde08447455f', '2026-08-28 17:26:36.424209+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('834a8913-0ce8-438a-8007-56ab3d8feb27', '2026-08-28 17:26:41.179485+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eba60964-7617-48c2-a4d0-7b44a21b7ad6', '2026-08-28 17:26:45.401085+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('96bc0b15-2173-4e8e-8c03-e98abf52492b', '2026-08-28 17:26:46.501128+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/a1c991d5-a191-4480-b519-dc157dd18359/media', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a2a22dbf-264e-4232-b756-3cbc8372a93b', '2026-08-28 17:26:47.883176+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/a1c991d5-a191-4480-b519-dc157dd18359/media', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('33298886-e770-420c-8b0b-6c548c91c9ec', '2026-08-28 17:26:51.699035+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/ingest', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3b0ee3a0-6e55-4bdf-8671-fe8f30da1bb3', '2026-08-28 17:26:52.664608+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/ingest', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eb086301-181a-4676-824f-440b77de3c62', '2026-08-28 17:27:34.098498+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('69d5bb03-02de-45e4-a19f-41ec3cfef6e7', '2026-08-28 17:28:55.562595+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('004c955f-9acf-4d82-80dd-fbc663abca89', '2026-08-28 17:28:56.154217+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('249fdd51-d260-46d0-b5a5-2e805d6b620f', '2026-08-28 17:28:56.726708+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cd714403-c6f1-4aba-bf4e-cd334179e4b3', '2026-08-28 17:28:57.298333+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/0e16a345-140e-40c1-90e2-422a091baf45', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('80032d91-e45d-4b4e-a066-cabc1626afa2', '2026-08-28 17:29:23.447318+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/6018db84-a33f-48e8-85be-bc97e8f6c4ef/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('18c12192-9e62-47e9-b7e9-8da275ee402e', '2026-08-28 17:29:25.742821+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/7598b133-eb89-46b2-9653-cd86a907c835/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('65232863-84db-4b35-afd1-bf8a48df01bb', '2026-08-28 17:29:26.591725+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/3dce8079-cfdd-4182-af12-89ea63e13bb9/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9c36c736-e237-4003-8a5c-39361fe49ac1', '2026-08-28 17:29:27.606904+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('070bc826-a081-4924-b455-4ac7069d03e8', '2026-08-28 17:29:27.887698+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/6018db84-a33f-48e8-85be-bc97e8f6c4ef/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('98f9f2cd-28cb-47d6-9b74-a3a8bcf8da3a', '2026-08-28 17:29:42.063313+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9a268dd4-7857-4f89-9269-7f62fa11aec6', '2026-08-28 17:29:42.637581+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/838ff203-0e96-4ea3-8c56-18ecbcd1a120', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('26d748fc-7c2d-479f-9ae2-a8041ce0965d', '2026-08-28 17:29:43.605526+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('59635739-ed60-4f02-b300-6be110a9da4f', '2026-08-28 17:29:44.171624+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/questions/838ff203-0e96-4ea3-8c56-18ecbcd1a120', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8604491b-4122-4626-83ea-9677bddf62f8', '2026-08-28 17:29:44.476041+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'DELETE', '/admin/questions/838ff203-0e96-4ea3-8c56-18ecbcd1a120', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8e8fc77f-b5ab-4feb-911f-534510cf93ab', '2026-08-28 17:29:44.770157+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/838ff203-0e96-4ea3-8c56-18ecbcd1a120', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('877a4072-2fd1-4b79-8bb9-d7e8f24fef13', '2026-08-28 17:29:48.689858+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a9e789dc-3dde-41c8-998e-21e89b8d597d', '2026-08-28 17:29:48.990349+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('609b1542-b653-4611-902d-73d4e3a99580', '2026-08-28 17:29:49.292302+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bc9a2fae-ecff-411e-b220-4ac05f848549', '2026-08-28 17:29:49.850511+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/93246039-973b-4d02-8297-1421b7a4e8e8', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b74c4ce0-6914-49d0-9086-6f97167aeac2', '2026-08-28 17:29:50.708574+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b415a3ef-b050-44d8-9653-797288e6aa83', '2026-08-28 17:29:51.436142+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tests', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a56327c5-eee9-497e-b6be-e1cee3e7c382', '2026-08-28 17:30:27.404623+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('09bbe677-1011-4a66-a874-1c9d3c17d33a', '2026-08-28 17:30:27.686718+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('24b0b155-d85d-4ffc-8127-c970fd779d5b', '2026-08-28 17:30:27.980103+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/pyq/bulk', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('85626a8d-cdc4-4fe9-95d5-4321a09b1a51', '2026-08-28 17:30:28.708536+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/d3ae583e-82b4-41e7-98b9-066d8e4b6123/quiz-config', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('be4ac2d4-a873-4bc4-99df-bc5beff7c8f2', '2026-08-28 17:30:29.005671+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2c149840-94b1-4ed0-a6e1-cd09dde22d41', '2026-08-28 17:30:29.303934+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/subjects/894968a6-463a-4b3b-a3fa-3ce0b36ce41a/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8a490f05-2a1a-468c-b85d-c7889117af4c', '2026-08-28 17:30:29.607688+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/2ea981f0-0f2d-4135-83b6-282129e56ca0/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8a6dc01e-17f4-4955-8066-d09a6d0dac98', '2026-08-28 17:30:29.888019+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/4181c1ea-a17b-4543-a08a-7533df39d244/quiz-config', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3f93d36b-b9aa-4280-b868-a23270d30aa1', '2026-08-28 17:30:30.215225+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/2e6b2e47-23c0-485c-8c8a-59ba123f982f/quiz-config', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d6935693-cf2c-4479-8abd-4d2556af840a', '2026-08-28 17:30:30.505841+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/2ea981f0-0f2d-4135-83b6-282129e56ca0/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b8753ac6-a9a5-44da-b406-b8da030bc3a8', '2026-08-28 17:30:30.801904+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/2ea981f0-0f2d-4135-83b6-282129e56ca0/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8ce70fb5-5c04-465a-9cb4-e5cc8dcf2c7b', '2026-08-28 17:30:32.279962+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/ecca13c3-4458-440f-80be-9bed7d218de3/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('95d9b3c0-5833-4296-b119-b32f7dec87b5', '2026-08-28 17:30:35.631921+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/e8c2589b-5043-423f-be0c-b18f5f35badc/lab-upload', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3ae7d2d5-0653-457e-9e1a-7f51e03d74b1', '2026-08-28 17:30:35.99222+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/modules/e8c2589b-5043-423f-be0c-b18f5f35badc/lab-upload', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5cd91e11-29e0-4893-b7b5-c0c7d35a925b', '2026-08-28 17:30:36.267259+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6f3efab6-c4ac-46a3-a5ed-f4fb63193355', '2026-08-28 17:30:40.123318+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('def5d12b-2405-4338-bc47-7f1376a6219b', '2026-08-28 17:30:40.448764+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c0b00f81-eb25-40c5-8648-bcf2665e9e9e', '2026-08-28 17:30:41.166489+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/c1125a1b-37a6-473a-bcd8-14cd7668ce10/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3b8a0351-04d1-4c3c-bbe3-7d0228305910', '2026-08-28 17:30:41.460379+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/c1125a1b-37a6-473a-bcd8-14cd7668ce10/subscriptions', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f1167f9d-0259-4349-8ec3-68c05b88575a', '2026-08-28 17:30:42.239209+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b2d68c99-2892-4dca-ab8e-fec29d0d0bac', '2026-08-28 17:30:42.513023+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 409, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7b853d12-1f51-46f1-9212-6c53205d3844', '2026-08-28 17:30:42.766422+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('20e99ece-a577-437a-8578-40c9b1c33fd7', '2026-08-28 17:30:43.237771+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('66d6a57c-9bde-4c9e-9ffe-d3536b2c3428', '2026-08-28 17:30:44.446125+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b4ce4aec-2a67-4815-abca-39650b00c1b0', '2026-08-28 17:30:44.847043+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/e4112d30-7733-4674-bc15-32b0c3695361/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9bee4d11-c987-4532-8790-37651ea7420f', '2026-08-28 17:30:45.131007+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b3ac21af-14b2-43d5-84cd-743311a29c39/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4c9288ce-5b5f-4472-950c-890a1ddaf481', '2026-08-28 17:30:45.428328+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b3ac21af-14b2-43d5-84cd-743311a29c39/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1d0420b8-7fae-4e8c-93ed-c2a701666b40', '2026-08-28 17:30:45.704256+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/e4112d30-7733-4674-bc15-32b0c3695361', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7f33230e-efc1-4517-bdac-021b25138bc3', '2026-08-28 17:30:46.001428+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/e4112d30-7733-4674-bc15-32b0c3695361', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('07c2e393-ec15-41ad-8943-a058cc1a8200', '2026-08-28 17:30:46.280366+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/b3ac21af-14b2-43d5-84cd-743311a29c39', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('770ad880-7b4c-47ff-b0ec-0b4923ad063b', '2026-08-28 17:30:48.253489+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users/103bf9eb-eb9a-44c1-98d3-d102a42b12ba/password', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('88fd80b1-a93e-4759-b640-e51e3348acfc', '2026-08-28 17:31:12.975261+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9163c980-7e4a-4005-b8fa-256ee708280e', '2026-08-28 17:31:17.746285+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c138d375-f123-4e69-a5db-afcafaab1ea5', '2026-08-28 17:31:18.064113+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b08a2fe0-dcfc-4087-b9b3-6b20b3b11b01', '2026-08-28 17:31:23.081301+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a4664ba2-cfbf-4c62-bf8a-8444a10c95d6', '2026-08-28 17:31:23.374745+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6a36d48c-08b5-472d-80b3-6886c6f6f184', '2026-08-28 17:31:23.692745+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2d70e580-e58e-4055-afad-97bf64696db9', '2026-08-28 17:31:24.090372+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/289cc65b-91d6-49cd-8c65-8c40c1fab9fc', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('30a392f1-0401-46f5-875c-1076c57c6e35', '2026-08-28 17:31:30.069733+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bad1ef20-05be-4584-b596-4e6de2838dfa', '2026-08-28 17:31:34.197856+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/ingest', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0abc6265-a341-44b0-b340-330eec2ba49f', '2026-08-28 17:31:35.165921+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/ingest', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9b0a03e7-0fca-4c54-b42e-af71413a4367', '2026-08-28 17:31:38.509395+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('967e599a-806f-44a8-9071-ee31b10b4e6b', '2026-08-28 17:31:39.137486+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/5937186f-81cc-4a75-97f6-7e66638f9e90/media', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6b54b3d9-7e08-4991-8ebc-a8618c6dee3e', '2026-08-28 17:31:40.491859+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/5937186f-81cc-4a75-97f6-7e66638f9e90/media', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('81839324-710b-49ed-b96c-2c8de09f8aa6', '2026-08-28 17:31:45.261629+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f826365c-312a-4c84-b866-490b12b56d22', '2026-08-28 17:31:45.81953+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c80093bf-dbfc-4863-b02d-87064181664b', '2026-08-28 17:31:46.37627+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0f7b16bf-9587-46ad-b070-428e571476d7', '2026-08-28 17:31:46.972124+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/8b81af7b-72aa-437d-b8fa-342f26393a02', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cedac2e8-11f4-4993-bff5-9bc02cf944f6', '2026-08-28 17:32:22.00276+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9fee704b-80b5-44f9-acb4-2133363b63c4', '2026-08-28 17:32:22.714943+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('31dbd0d6-f100-4f82-bcb5-51331a8b756a', '2026-08-28 17:32:23.456015+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('dc6c4140-3c88-4305-bc45-1c4b8653a94f', '2026-08-28 17:34:00.747043+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/d75f7786-0c18-4166-b589-e207724d4357/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('227d79fd-441d-4e3a-b213-d4682e86475a', '2026-08-28 17:34:04.312063+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/522a91c6-abd4-445c-8192-0a045e8de4ee/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2f36ab9d-1033-41b4-89b7-1728c762f3c3', '2026-08-28 17:34:05.49852+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/bde4c999-a06f-45c1-b02a-606283b2e16f/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0d51d03e-582c-42e1-91a5-d75633bf56ea', '2026-08-28 17:34:06.989079+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('aed1c66c-b87f-4055-b48b-c9189e222463', '2026-08-28 17:34:07.375266+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/d75f7786-0c18-4166-b589-e207724d4357/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('50a6ed04-11f1-4010-9150-1372f0b5a98b', '2026-08-28 17:35:24.932368+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b576f71c-128c-46ef-ba75-e3634c5597ff/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('69318b91-dd68-473e-b155-13b885aba6f4', '2026-08-28 17:35:25.38982+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b576f71c-128c-46ef-ba75-e3634c5597ff/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4fbdf0e4-b752-4cfe-b50f-696402819c06', '2026-08-28 17:35:25.870381+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b576f71c-128c-46ef-ba75-e3634c5597ff/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('294f3f45-1b2e-4d87-95aa-6dd5005af0cb', '2026-08-28 17:35:26.406168+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b576f71c-128c-46ef-ba75-e3634c5597ff/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('32e7e5da-731e-47e9-87c4-7084a3690b3f', '2026-08-28 17:35:26.948275+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b576f71c-128c-46ef-ba75-e3634c5597ff/modules', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4fb1cbc1-3010-4656-ab69-d409fb2dea81', '2026-08-28 17:35:27.85023+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/4b77e5dd-259f-4a95-a43a-ff9acfefb21c', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2fd24ac1-7dcf-493c-b3ad-e9bbe79408dc', '2026-08-28 17:35:28.381316+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/b082b2a8-e8e6-4624-b3b3-9c52903555ca', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('879cee62-8c7c-4933-b279-a0365c654b25', '2026-08-28 17:35:29.385347+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/topics/3c84c37a-6056-450a-a281-fa49b8c849a5', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a7e9130c-da27-415f-9080-fc432d32cf8d', '2026-08-28 17:35:30.435435+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/topics/3c84c37a-6056-450a-a281-fa49b8c849a5', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('99e4a4d4-a051-45d0-8dd0-d8c880807829', '2026-08-28 17:35:32.170919+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/chapters/b576f71c-128c-46ef-ba75-e3634c5597ff/topics', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d3843162-10c5-4070-bc61-6c9233425ee9', '2026-08-28 17:35:32.605064+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/topics/38bb643f-7ec4-4fac-9ae0-1866ffc351a0', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fd322249-9f79-4e0d-af91-05e3e553a9bc', '2026-08-28 17:35:36.35472+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2d341d9c-dbd7-44ed-875b-ad0c7b7c6d54', '2026-08-28 17:35:36.816523+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/93e6bcb2-c577-44e5-90fc-9a6e02bbb9bd/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('974bbd97-3396-4a9c-83ff-27372eea56fc', '2026-08-28 17:35:37.295344+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/93e6bcb2-c577-44e5-90fc-9a6e02bbb9bd/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7ad47a9d-2cf0-4778-9763-413fb9817a4b', '2026-08-28 17:35:37.765223+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('73491da8-6913-4935-96f6-ac1481258203', '2026-08-28 17:35:38.211805+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/8d739675-c05e-464f-948b-cebf6225561b/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0a51cc7f-0ec8-4c36-a62c-002a1b598d34', '2026-08-28 17:35:38.71818+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/c7783fd1-04be-46c8-b754-2cb0409b6452/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('66a15527-af3a-479c-a2a9-d7d445d6968a', '2026-08-28 17:35:39.162749+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/43d3bf95-2dc1-40f1-b3d2-3ad71b3d2526', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d02294a4-cd23-434e-95bf-00872a4781c2', '2026-08-28 22:32:17.9628+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b0c7bfd2-9f37-42d3-bb0a-641d637e8181/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ecec3a19-aaec-48a5-aa5f-df0f8cedcc91', '2026-08-28 22:32:18.395114+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/8f8052e8-f4c9-4df6-bb18-0f2e0727400b/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('53cbd46d-3df7-4831-8f49-3aea4491bce7', '2026-08-28 22:32:18.844902+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c9e0f939-1568-4a37-9fda-82e3d2f0c48f', '2026-08-28 22:32:19.624321+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f6a453fb-354f-4fb0-8a4d-ff0ea12d88a8', '2026-08-28 22:32:20.086258+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/1388b75c-63d8-46d8-8a6c-7b82f513fbc2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3a37fe87-3abc-4e0e-b6bb-7ebf0ede20a1', '2026-08-28 22:32:21.462024+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b0c7bfd2-9f37-42d3-bb0a-641d637e8181/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('792e9be2-04e3-4053-857b-5b847f5b9eba', '2026-08-28 22:32:21.953663+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/1388b75c-63d8-46d8-8a6c-7b82f513fbc2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8997e1ab-ca79-45c7-b314-3f4c447fb1b0', '2026-08-28 22:32:22.780003+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/1388b75c-63d8-46d8-8a6c-7b82f513fbc2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a8077af0-c28f-4d4f-b6fc-9d26d061215d', '2026-08-28 22:32:35.173983+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cd39f295-c374-4d81-852a-9bbdb2755e14', '2026-08-28 22:32:35.766767+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/a94e2c8f-ed6f-4b48-8386-dc3cc52d0d0a', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2cb25d5c-7011-4cf2-beef-291c6e8e0448', '2026-08-28 22:32:36.908983+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('14b71cab-180d-4c3f-8f9f-d2a3433558fc', '2026-08-28 22:32:37.50014+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/questions/a94e2c8f-ed6f-4b48-8386-dc3cc52d0d0a', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('df2d3396-e6d2-4e82-bd7b-eef0caf7bc6f', '2026-08-28 22:32:37.833196+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'DELETE', '/admin/questions/a94e2c8f-ed6f-4b48-8386-dc3cc52d0d0a', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7dc2b9e6-5e69-4b12-b461-af5e5540d4fe', '2026-08-28 22:32:38.140407+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/a94e2c8f-ed6f-4b48-8386-dc3cc52d0d0a', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4853f0aa-16e6-4c60-8422-941d5322d197', '2026-08-28 22:32:52.758752+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('562f8d7f-69b8-4534-a134-7f4612bd48d3', '2026-08-28 22:32:53.090799+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a78893cb-0591-43b1-9c74-2242462eb5db', '2026-08-28 22:32:53.441177+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c2f47458-b857-4cc4-82d5-c47cf64406b7', '2026-08-28 22:32:54.047536+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/832e432f-5cd0-4c77-89e4-e75a506d3db0', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bf988236-dd12-49b7-989e-f99bc17b1ff9', '2026-08-28 22:32:54.959647+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7f719d28-22dc-4d87-8005-42c1b245a95f', '2026-08-28 22:32:55.71902+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tests', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5bc9d38f-9dc3-4d13-88fa-5b54d8870fc5', '2026-08-28 22:33:07.102186+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c8301de4-7624-41db-87a1-869505e85a2c', '2026-08-28 22:33:11.828698+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6ac7742d-34b8-4172-8a5d-0336251d4077', '2026-08-28 22:33:12.162371+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6794ff85-9812-45a5-88ef-6457e4e9f00a', '2026-08-28 22:33:17.296984+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2bff55c7-5325-45e0-9921-94ab286c2042', '2026-08-28 22:33:17.60812+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5a05e867-7746-44a0-8192-50fd07818f41', '2026-08-28 22:33:17.919134+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('84f02c56-7081-4191-b383-794b48ec9acc', '2026-08-28 22:33:18.214155+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/eb1a876f-97d7-41a1-afb5-da498852a647', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ee18de6b-1ab8-4844-8ce6-c16fbb19c775', '2026-08-28 22:33:23.91291+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/ingest', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('865160c0-790b-425d-a7ad-c850e4ae29d8', '2026-08-28 22:33:24.960958+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/ingest', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e796514c-6be5-4062-b1f4-6d8e0563cad4', '2026-08-28 22:33:28.335994+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('293c684c-efbb-40ca-8597-7f98da64224f', '2026-08-28 22:33:29.169422+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/7d132e8c-12f2-4204-a283-1a922dfc485c/media', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d901d737-5052-4072-938b-b1cb751028e8', '2026-08-28 22:33:30.567325+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/7d132e8c-12f2-4204-a283-1a922dfc485c/media', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('91df001b-9d98-4b7e-ab92-0aec2f116304', '2026-08-28 22:33:35.249308+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('98731d1c-e0d9-4697-8756-7ab781cd4957', '2026-08-28 22:33:35.844971+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ffce8124-ddea-4700-8f2d-60dadbf92eb6', '2026-08-28 22:33:36.398019+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3e2c3840-0812-4a23-9cfe-32e2c7268e8a', '2026-08-28 22:33:36.995269+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/359f1432-7540-4a2e-8f0d-8d68016a3b3b', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('81a15508-4a84-4b5b-8517-b543c4676125', '2026-08-28 22:33:41.324426+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/c7fe6b90-4bd4-45c7-8b5c-1d10ee33867e/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3be184c7-70cc-40f3-b963-1a2701707f79', '2026-08-28 22:33:41.629504+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/2806ca28-779a-447c-97b0-6ef7f34b3ddf/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('77ee6837-2cfb-41f3-b347-255523fe2ae6', '2026-08-28 22:33:41.946703+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('63b46448-b296-4d83-9ebf-39642736879d', '2026-08-28 22:33:42.50899+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('982e4701-057e-46b0-903e-7b5e7a3cfac9', '2026-08-28 22:33:42.947621+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/5a75021e-e3f2-413c-87cb-8be039751569', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('54df2e07-7d42-44f1-aa36-ae1db9bf97f0', '2026-08-28 22:33:43.910351+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/c7fe6b90-4bd4-45c7-8b5c-1d10ee33867e/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c210497b-4009-4f31-b1e9-543dbd07b98f', '2026-08-28 22:33:44.209031+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/5a75021e-e3f2-413c-87cb-8be039751569', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c8f20838-2a56-4354-8470-4e69649e82e8', '2026-08-28 22:33:44.788237+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/5a75021e-e3f2-413c-87cb-8be039751569', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cf05cadf-7050-4ce4-bc63-53210b1e2fb4', '2026-08-28 22:34:25.690906+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c56d7854-2664-4318-b7dd-49029fbde25a', '2026-08-28 22:34:26.599018+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('678133ae-d412-4666-ab2b-464a4d42ef3c', '2026-08-28 22:34:27.796976+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f095a9f0-d2bb-48c5-8825-fb416404205e', '2026-08-28 22:44:31.709779+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('833d2427-43e5-4bf5-a5dd-39f06c54f7b2', '2026-08-28 22:45:52.002449+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4276e8e2-dedc-4444-af4a-5a758682aba5', '2026-08-28 22:46:11.098897+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1c2999b5-2c11-40a5-b738-ea9f82b76430', '2026-08-28 22:47:06.518184+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bce936bd-04b6-4ce7-8ab8-4dc08c880875', '2026-08-28 22:47:45.759381+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('39572758-5dd6-49f7-9d4a-eb90b3ed44c7', '2026-08-28 22:54:08.907746+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('569cda68-0b31-4608-9591-9f3e692071ad', '2026-08-28 22:54:09.193369+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/d28cba25-a204-4a59-9e39-390d08cb7389/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('81c3a006-305d-43de-ada5-1738fad80d3a', '2026-08-28 22:56:07.782804+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('04a25d25-5cfd-45e8-885c-12dc16148447', '2026-08-28 22:56:25.906854+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('60535ca7-4b7a-447a-b43e-f7f7603dce2e', '2026-08-28 23:09:03.911453+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1f6c66e8-9d5b-44a7-9168-4d0804433df3', '2026-08-28 23:09:04.341882+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0063decc-426c-4877-82d3-c95922abe159', '2026-08-28 23:09:04.761908+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0112add6-1571-4ba0-bb85-c666718c0561', '2026-08-28 23:09:05.159387+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('23eef129-7502-4643-a4c4-c35da0cd19f9', '2026-08-28 23:10:44.583567+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6ccdae67-19ef-46bb-8c0a-17e69b45538c', '2026-08-28 23:10:45.024494+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c0b2865f-7cad-4849-a777-c016da1a14e8', '2026-08-28 23:10:45.346802+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('470d62d2-29d3-4ab0-98ce-6b9e00c86c2b', '2026-08-28 23:10:45.646361+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fc57989e-de1a-4d04-b726-5d0bc0ba100f', '2026-08-28 23:10:45.966143+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0e9d1098-bdf7-4d3c-8a19-76b967de1a13', '2026-08-28 23:11:00.991729+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7d536084-438f-4b17-b9c4-6866f3e0ad21', '2026-08-28 23:11:01.313922+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5ee7f88b-4a40-433d-84b6-16302145b69e', '2026-08-28 23:11:01.611252+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7232b91b-8e0d-4696-882d-ab3d13078365', '2026-08-28 23:11:02.227203+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/0bda04ed-db1d-478e-b604-b670725af701', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('886ebeba-4a10-4ddd-93be-9b263f04e4bb', '2026-08-28 23:11:03.118053+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('84f49b02-bf06-482e-804c-1cb421577aab', '2026-08-28 23:11:03.865285+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tests', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a019ef07-3c79-422b-a3d0-5e552cb026b4', '2026-08-28 23:11:07.534815+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('22f2e7dd-ca24-4280-8dbe-7c5fdd9aa8bc', '2026-08-28 23:11:08.109484+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/540f2fe2-ece7-42e4-bb62-c055d4f0a7e6', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3c78faaf-f399-4fd2-ab61-b462775f944b', '2026-08-28 23:11:09.225603+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('76b4a1b4-1359-4d73-809a-7a368176d3db', '2026-08-28 23:11:09.78478+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/questions/540f2fe2-ece7-42e4-bb62-c055d4f0a7e6', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9c06f962-6d48-4e5d-b110-8542052fb1d8', '2026-08-28 23:11:10.084508+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'DELETE', '/admin/questions/540f2fe2-ece7-42e4-bb62-c055d4f0a7e6', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('121f9239-7e0f-420a-9660-bfb6101c58b6', '2026-08-28 23:11:10.373967+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/540f2fe2-ece7-42e4-bb62-c055d4f0a7e6', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eb057cda-faae-47ee-a734-2ea3d051a8ef', '2026-08-28 23:11:15.073453+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7a587efd-6066-4fd8-854e-6f61100bd089', '2026-08-28 23:11:15.676316+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4a3c7ea4-a84b-43c9-836f-31b6519ea9ee', '2026-08-28 23:11:16.272834+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('beff3bee-7768-4c83-a071-398d6b0e67b2', '2026-08-28 23:11:16.888264+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/02ff13c4-aa76-4694-a1ca-127df73cf848', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6a796e6f-11f5-4c36-80e1-bba4b05c50fd', '2026-08-28 23:11:21.266925+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/1afa9757-114a-4495-9da4-ea6f40981342/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bd96f904-e88f-4036-b3ef-448e2db1883e', '2026-08-28 23:11:21.676481+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/b020f5fe-6861-4cbb-a9e2-aa839b9eebd4/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('505310b1-7f1a-4ef9-b7d9-38c917b1c0ad', '2026-08-28 23:11:21.978298+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9742149b-2ade-472f-b092-abbcb127eae6', '2026-08-28 23:11:22.868753+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5bcd9f2b-ca8a-47a8-90b2-fab75ff0c6c8', '2026-08-28 23:11:23.279996+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/e70c5efb-d2cb-48c8-9810-a07b62515215', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('22747b02-bbd8-48f7-8ee7-d02ea44ccf46', '2026-08-28 23:11:24.668613+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/1afa9757-114a-4495-9da4-ea6f40981342/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a7a61153-036a-4b42-adbf-e707e7e6ea36', '2026-08-28 23:11:25.11404+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/e70c5efb-d2cb-48c8-9810-a07b62515215', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('27666bd0-0a88-4f9f-be54-f5dc447edf16', '2026-08-28 23:11:25.953773+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/e70c5efb-d2cb-48c8-9810-a07b62515215', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ec76a847-835e-411c-af79-df35959ad5d0', '2026-08-28 23:11:30.427092+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('32ab09f7-0619-4a12-856a-7c2ca717a6fd', '2026-08-28 23:11:30.871698+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cb859632-e1e9-4ddd-8a0b-358c9e082899', '2026-08-28 23:11:31.498629+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c7bc316a-04de-4b11-8c9b-9bac762d5c26', '2026-08-28 23:11:32.092633+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/093b49ee-0c26-40f3-8c13-89064a466537', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('de6830e2-eba1-4dcc-ba8b-99f61e330adf', '2026-08-28 23:11:39.896576+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('51e221e4-6f04-4895-b289-60a24f390710', '2026-08-28 23:11:40.317317+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5fe73e3c-82c9-479d-8345-f0c38bca7284', '2026-08-28 23:12:10.850486+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d4c0391f-26ed-4b41-98b2-f8ca766ba0cc', '2026-08-28 23:12:11.445517+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9c0c7fef-c332-49c9-998a-1a84d7b72165', '2026-08-28 23:12:12.195901+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('69d40853-86fa-4732-b65f-d60c2497334f', '2026-08-29 07:48:06.142497+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('011e5e39-fad4-4996-9ce9-dbfe015f164b', '2026-08-29 07:48:06.636431+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4a390dfa-0310-4b1b-8610-7727341e1651', '2026-08-29 07:48:07.248269+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fdd024a0-29e3-44e5-bb12-7cf8efb52423', '2026-08-29 07:48:07.734624+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('221cee40-6185-4f31-8141-d7f1b4dadf24', '2026-08-29 07:48:08.236805+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('33388d1f-d3c8-4682-8cbc-49300c49aebb', '2026-08-29 07:48:16.232838+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d700d734-2094-4fc6-a3b3-d0025daea22d', '2026-08-29 07:48:16.752307+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3f60cd3f-3797-45b3-9085-9741ae446a45', '2026-08-29 07:48:17.23146+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1336e7cf-a771-4f5d-bbc4-fd5f4c4e06c9', '2026-08-29 07:48:18.109269+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/5f08a51a-a268-42a9-8d2a-8917180750c8', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fd22aa02-bf4d-451d-a574-013a3deb0fc9', '2026-08-29 07:48:19.436196+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cc083269-203e-4281-982c-ac427e16b750', '2026-08-29 07:48:20.605906+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tests', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('272d558a-31e2-4d6c-9ce4-2f8d1767777a', '2026-08-29 07:52:02.201507+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f25ab22c-44f3-45b3-b649-eabdee0f3fe0', '2026-08-29 07:52:02.387172+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/da51b2e9-26d1-4d39-a6f4-d5d24fe0baaf/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5fc55763-240e-4737-ace0-96233f95b497', '2026-08-29 07:52:02.563901+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b649a354-7818-4787-9f51-a956ee37f17b', '2026-08-29 07:58:17.608203+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9a389677-4216-46de-ae8e-af1db790ead3', '2026-08-29 07:58:19.230906+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('48cd6035-019c-48d6-b302-1511fff8d33a', '2026-08-29 07:58:20.618034+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e966d380-964e-41d4-8140-a9788e8cbc84', '2026-08-29 07:58:38.57414+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('00279c3a-4dfe-4e2a-8b88-95f0c9ef7e92', '2026-08-29 07:58:40.579016+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ff28d6b3-987a-4f2c-b1f5-c78432130d38', '2026-08-29 07:58:42.093163+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('665affc2-6175-49d5-9685-0ee8c902db12', '2026-08-29 07:59:59.969569+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a4e4d5b0-1534-4ff2-a1e5-f75debe076ec', '2026-08-29 08:00:06.99528+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('149b8954-9baa-4b9e-88c5-845ccfdf0bf0', '2026-08-29 08:00:08.715021+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('85fe1465-18b2-4324-9fcd-9d45918771b7', '2026-08-29 08:00:10.075032+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d62eee00-51f1-4dcd-a6bc-8357cb9b8109', '2026-08-29 08:03:59.674641+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1a74425c-6379-4b79-bc00-c3d3f4f4cb65', '2026-08-29 08:04:00.063374+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1ec228b6-ddb4-47ba-bc19-5c2d48ffa500', '2026-08-29 08:04:00.484619+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ebfbb2de-cc12-4461-b132-baf2cfaa5d2e', '2026-08-29 08:04:00.927473+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1433a759-188f-4afa-b737-d0b721d13b5d', '2026-08-29 08:04:01.465718+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/5c51a7c1-4c56-40b3-8e81-a87ecb136b51/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('995c1cb0-8e16-4128-b419-3ea9f3994476', '2026-08-29 08:04:59.556312+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d7f8039f-4118-4107-a030-e53f59b841a8', '2026-08-29 08:04:59.90054+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2a7bb068-93d4-4da5-bda7-e211a3f16e4f', '2026-08-29 08:05:00.369446+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6544c9c1-ef7b-4cf0-8d46-af586f2ae7b8', '2026-08-29 08:05:00.799571+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('54f389e0-9834-4b3d-bee9-768fa1232040', '2026-08-29 10:16:57.74438+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('523dc396-196f-42dd-a32d-fa1176a107b9', '2026-08-29 08:05:01.271819+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/4d3e7aa3-c6fa-4e3e-93a2-d3687ec90b3d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bf58b179-f45d-456c-935e-f6b945fefd47', '2026-08-29 08:05:13.917253+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1fef8324-b937-4664-a16b-3ea6e7626aa3', '2026-08-29 08:05:14.2288+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7cddd246-31a7-43a8-924d-d5d9e0976c79', '2026-08-29 08:05:14.859196+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('721138c6-2ebd-4e2d-bb1a-6a5f691c3cc3', '2026-08-29 08:05:15.324946+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('47efb40b-bd34-4efd-8703-9fa841a10f34', '2026-08-29 08:05:15.855256+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/87db7b6e-d395-49fc-8c54-b87d2be20421/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f410df93-8213-40b2-9f32-8cbba3740588', '2026-08-29 08:07:17.615542+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('befda169-e3eb-40ec-af1b-abef38375d30', '2026-08-29 08:07:18.031936+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cc1b8f40-91be-4267-ad34-9fb2cdab0b24', '2026-08-29 08:07:18.398221+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('65e22c41-96c2-4143-af5d-324194ae0e23', '2026-08-29 08:07:18.856683+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cb4ba7f7-48f5-4ce4-a064-f29b48b5451b', '2026-08-29 08:07:19.299954+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/dee7aac0-5c3a-424e-a72a-1b00df798b18/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('23a5e8bd-33fb-4047-9841-4e1bacc7f5f2', '2026-08-29 08:07:29.582199+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e6e902fe-4e75-4c82-bac9-dd779f0c46d9', '2026-08-29 08:07:29.988874+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a433f03b-4698-457c-8dc4-d5c9e5ee444e', '2026-08-29 08:07:30.365711+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('404d401a-af19-4df4-acf3-31f3415e8902', '2026-08-29 08:07:30.747466+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4504b76a-8558-47f0-96bd-e201b1a1e464', '2026-08-29 08:07:31.164025+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/4dde4e6d-e6db-40bd-809e-863a40012330/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c2134fb4-050e-4e8a-aa9c-89d35644f6ec', '2026-08-29 08:08:56.192498+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('de75610c-62a4-4efa-b248-1fba18c09163', '2026-08-29 08:08:56.595822+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ef0ff6bb-0d17-4cf0-af45-8ea3075ee1d4', '2026-08-29 08:08:57.032179+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3944ba64-3935-4916-a644-30c320dab54d', '2026-08-29 08:08:57.421105+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('984f8b20-ab3e-43e9-9783-366ae5b91538', '2026-08-29 08:08:57.934679+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/abd949ee-0388-40df-8be2-8c4fbff2ef5f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2636e68b-b595-4570-b273-740a3d2d5621', '2026-08-29 08:09:23.605879+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d47a91f6-cc89-48d6-a24f-bbe23e232222', '2026-08-29 08:09:24.054044+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('00a6cc9f-23aa-4247-b8be-a0256cc0d80c', '2026-08-29 08:09:24.435117+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d23c9dae-f2c4-4904-8e70-3da73bfdac9b', '2026-08-29 08:09:24.884165+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('39b6b8bb-0e00-4129-a1db-bbca47526862', '2026-08-29 08:09:25.320259+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/08bb65c0-65b2-451a-a5ab-b8d4d24a2eb7/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('97817936-8d76-4a32-9840-3655a3f79ec3', '2026-08-29 08:10:18.633514+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ccce5ff4-c8b8-4f03-95f0-2f59013beaff', '2026-08-29 08:10:19.07311+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1bb2e26b-4d48-480c-8464-e93a3e3970d6', '2026-08-29 08:10:19.499343+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4645053f-b1eb-41fd-99a6-41681faee8c9', '2026-08-29 08:10:19.942873+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5983ee27-a460-4c3a-8cc6-55eced7723cf', '2026-08-29 08:10:20.345603+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('707edab3-605a-421f-94a2-b6270e711429', '2026-08-29 08:10:33.093935+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('33daf2a8-7778-4d03-967b-1c71949e1952', '2026-08-29 08:10:33.366972+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b14b9dba-f4df-48a8-997b-d6b8c67f3c9d', '2026-08-29 08:10:33.855012+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a9f0a210-9295-4b9c-be4a-db140543235a', '2026-08-29 08:10:34.754284+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/afb59771-b774-4647-82aa-489dc6a2bf3b', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0502a4e7-6dac-4fae-a4f7-67e0abe421a1', '2026-08-29 08:10:36.11451+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bc36b722-5b02-437d-b5f4-99b25b945473', '2026-08-29 08:10:37.207238+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tests', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('dbf0710f-f6a7-4445-b11a-b249690c720c', '2026-08-29 08:10:40.601203+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9e7e4e47-506b-4d90-949b-eab2f5c28de7', '2026-08-29 08:10:41.315298+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/ff067bb5-6a40-4af6-9d63-4ee903baffb2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2e1edd7f-c365-41c5-a727-32b87e3e9645', '2026-08-29 08:10:43.068534+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cc8dbc23-f75a-484b-89bb-408502edef5a', '2026-08-29 08:10:43.923489+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/questions/ff067bb5-6a40-4af6-9d63-4ee903baffb2', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('377e9dd3-4364-42c7-af31-223548b7cce4', '2026-08-29 08:10:44.49176+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'DELETE', '/admin/questions/ff067bb5-6a40-4af6-9d63-4ee903baffb2', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9643989c-bd5b-489c-828f-a65435cc4370', '2026-08-29 08:10:44.980627+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/ff067bb5-6a40-4af6-9d63-4ee903baffb2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ae82e42b-3892-4710-a46a-46e8c368a490', '2026-08-29 08:10:50.362306+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ddc7c162-3c83-4b6c-b0bc-b0fec3cff25c', '2026-08-29 08:10:51.213846+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4e76d738-1eec-4c96-bfbb-b7847fc17387', '2026-08-29 08:10:52.033229+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e3f568f4-ed68-434e-badc-1a3b7b557d1b', '2026-08-29 08:10:52.90606+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/fec9bdb5-31bd-4797-92ae-d14be65766c2', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('678b5657-42c5-4271-af27-8218340b6f41', '2026-08-29 08:10:57.389637+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/02273d11-e773-40c3-b995-7264c7f537ff/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('29364473-3d7e-4373-a739-9d0e216dec4b', '2026-08-29 08:10:57.66249+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/d7b06d29-e640-4f43-90ba-7d0c3348a643/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a0fdceea-0787-45fb-9b35-844832e2123b', '2026-08-29 08:10:58.155571+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8cdded99-9505-4cf6-a97c-35e992b91570', '2026-08-29 08:10:59.012288+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6a4e663e-2488-4e71-8e29-a99fd9f56193', '2026-08-29 08:10:59.468731+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/d9b7fe7b-9bce-4dc6-99bf-bb15a35f4a2d', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('966f9938-bda6-4d28-8df7-6e279eb0dfcf', '2026-08-29 08:11:00.747327+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/02273d11-e773-40c3-b995-7264c7f537ff/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9edfbc4b-4ea1-4ff0-ad0e-e432e9d327f8', '2026-08-29 08:11:01.20616+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/d9b7fe7b-9bce-4dc6-99bf-bb15a35f4a2d', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a6aff8dc-91be-420c-9f99-189211ae00b7', '2026-08-29 08:11:02.07694+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/d9b7fe7b-9bce-4dc6-99bf-bb15a35f4a2d', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('489f7159-01df-497c-9060-37e3876b40d4', '2026-08-29 08:11:05.976857+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('af791a55-4172-45f4-8665-b23b8cb93a84', '2026-08-29 08:11:06.389945+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b5681feb-996d-432b-9eaa-1e5be60ebb36', '2026-08-29 08:11:06.865435+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d3c34c8d-f1c0-4ba4-8e3e-dda3fd128ce5', '2026-08-29 08:11:07.312956+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/48424235-a9e5-4381-87c8-b3e97596d58d', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f104a410-4e27-4f25-a698-0d24f1608193', '2026-08-29 08:11:14.532795+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fc02bc2b-7e9a-4e53-a9ec-65c610009cf2', '2026-08-29 08:11:15.019088+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8f131f14-55a3-475f-acb8-da9d14e22434', '2026-08-29 08:57:52.250342+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('70df5df0-d44f-404b-adb4-cff86aaa2952', '2026-08-29 09:07:02.706627+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('20d1bf2d-94db-4a14-bb0a-79c58053f9e0', '2026-08-29 09:48:52.568024+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('75cd9102-723e-459b-9ada-5bd21d51fba8', '2026-08-29 10:01:49.119843+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('54defe48-ecf5-467e-b51e-c91437cf3184', '2026-08-29 10:03:37.14915+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a4d974ef-ef60-4f36-b537-f9452e2ea9c2', '2026-08-29 10:08:00.509065+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e2f6ea0e-a4a5-40f0-90a2-a9ba8bb83959', '2026-08-29 10:12:14.344204+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f93ed434-8c37-4019-982e-8fe28e3faf68', '2026-08-29 10:14:16.097865+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('17f516c0-d39d-437c-9d36-0b67f6a68b30', '2026-08-29 10:16:41.719762+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eb3e6b7e-7b70-4cf5-a53c-0bb5e74321d2', '2026-08-29 10:23:31.156451+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1de9fbf4-c83a-45b4-b24b-96cb493b217b', '2026-08-29 10:23:47.186321+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('10a41202-973e-4b49-818e-875d9bf92dc7', '2026-08-29 10:23:49.15857+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('360cbb83-c176-4ca3-8ed8-8720f6d4b732', '2026-08-29 10:31:42.570452+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8b0fdae2-7ab5-4819-bc83-03992638dd9f', '2026-08-29 10:32:10.644605+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c708ff77-8682-4e98-999c-991624092189', '2026-08-29 10:32:12.665503+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('aeaccb44-442b-4af9-a33a-65b39e8b5c40', '2026-08-29 10:33:20.595603+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d5029276-43e1-4e15-88c6-e65e954d3a1c', '2026-08-29 10:34:07.251526+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0567fddb-3d3d-445d-8eed-48ef1467e1e0', '2026-08-29 10:34:09.267197+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9edbf646-479b-4f10-aaf4-33603f62f00b', '2026-08-29 10:36:20.839654+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('34aed8f0-b7f1-4c3d-beeb-edfd5d77065a', '2026-08-29 10:37:15.490035+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3e7a2a80-7453-4105-9a64-95173ec42e65', '2026-08-29 12:44:20.500708+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d04a6fc9-c92b-4870-bfcc-0cd12eedc1c0', '2026-08-29 17:17:53.681041+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4b50b13d-1d34-48eb-aacc-5f6c8b682915', '2026-08-29 17:18:00.478056+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/961c62e5-2326-464b-a97e-145c1382820a', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6502cfaf-7bb8-46ea-9fdd-75f7c64be62f', '2026-08-29 17:24:18.487081+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/3adfb229-4ade-42e2-929e-d0a4dbbbcfeb', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1bff78e3-2e0d-416b-9e2b-8b876ef69b5e', '2026-08-29 18:05:39.826231+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f33c7724-5360-47f2-b429-9efd678f92ac', '2026-08-29 18:05:40.244042+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1f7dfd39-f5ea-48ed-8595-982bf858b02e', '2026-08-29 18:06:00.907153+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('726b9d0f-a6e5-4c60-88b5-ab1ee44e8d9f', '2026-08-29 18:06:01.293365+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eba1db72-3a98-443b-bb1c-5d163d873cdd', '2026-08-29 18:06:39.837398+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8baa8a9e-cba7-438e-a8e3-618c894ea9e4', '2026-08-29 18:06:40.165262+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4af62300-c7ef-4458-89f4-0e4ccbafec34', '2026-08-29 18:06:40.983327+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/17379e87-d972-47d5-a59e-3937c15ac1ec', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1288d1b4-deff-45a1-858e-dddc3bf52e4a', '2026-08-29 18:06:53.356198+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('294540dc-43a1-4d8e-8dd6-539747c4c73e', '2026-08-29 18:06:54.23238+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4b9749d3-981d-4b0c-936a-b86bb839afba', '2026-08-29 18:06:55.10239+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5e0f3ec9-5ed5-4b33-a252-9a9b83606e1a', '2026-08-29 18:06:55.91958+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/8157d2d4-54e5-4254-bf6d-dea78d93ddd6', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0387bb45-7d11-470d-be03-c04a6ed63ae4', '2026-08-29 18:07:00.656368+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/f569b2af-e266-4597-bb28-10091362bda2/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('38813afa-f0aa-4597-bf22-bcb68b2aabd7', '2026-08-29 18:07:01.068875+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/bc206f91-ccf1-4953-8bff-d349d2ebb309/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b0048c7d-f27e-45b7-8b14-4e4a3dc4ec14', '2026-08-29 18:07:01.500401+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('78384439-3872-4a6c-8bd6-3a0d6ad57087', '2026-08-29 18:07:02.420621+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('84e92664-5c81-4d01-a07c-722eea05fdd0', '2026-08-29 18:07:02.870475+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/27d68da7-ddd3-4104-aea9-8bcaa35b52d4', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('957c88ed-3e36-4d8e-aedd-b2f44a9ab5c4', '2026-08-29 18:07:04.133804+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/f569b2af-e266-4597-bb28-10091362bda2/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d4425376-18ed-45a2-9941-4906f6fae732', '2026-08-29 18:07:04.574434+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/27d68da7-ddd3-4104-aea9-8bcaa35b52d4', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('082f95c9-304b-4d69-8e7b-e3e4b76b3e0b', '2026-08-29 18:07:05.431654+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/27d68da7-ddd3-4104-aea9-8bcaa35b52d4', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('99678ddd-a289-4373-a31a-781a354cb6a6', '2026-08-29 18:11:12.918571+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bcb116dc-1f25-4483-8bc1-50d2e6803f79', '2026-08-29 18:11:38.677103+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c6c4c797-6a5d-462b-b1ab-49e6abab4b39', '2026-08-29 18:11:49.607964+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4d08996f-9ec3-4821-bec6-0f4bd381778d', '2026-08-29 18:11:57.342669+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('edb8534d-6603-416a-b485-bbb73eb622a5', '2026-08-29 18:12:11.798425+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c02b2f44-8fd9-474c-a5a3-cdd17e2fe848', '2026-08-29 18:12:13.412083+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ea814c18-68cb-4fb1-aa57-acbe6fa62565', '2026-08-29 18:12:59.490848+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3a7f8b8d-976a-40f3-877d-9d1838d3e9a2', '2026-08-29 18:46:37.068168+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5bc3e656-936a-4e01-abaf-d51f8c780241', '2026-08-29 18:46:59.152775+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b3daeace-7af9-4b8b-911e-79db3c688f69', '2026-08-29 22:02:23.396712+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/d80a9487-449b-44b4-9d07-62048fef1e3c', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b54f545b-b5c2-4100-b3aa-f5cd1b167c32', '2026-08-30 04:08:48.750095+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/3c014560-c75e-477e-becb-1c1e91e40c6e/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('60d3c4cf-b295-463a-b6d8-c9151636082a', '2026-08-30 04:08:52.272208+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/11f3e870-0f36-4c88-944c-f08138482c93/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('35217c91-73b2-4809-8655-dc0afc337c35', '2026-08-30 04:08:53.451991+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/ace475b0-db61-4a52-8baf-650abc7bbf44/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b5b625e4-06f7-48af-8760-4c5414047c34', '2026-08-30 04:08:54.924536+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8e8cebf2-07c0-4131-9b6d-5b1d92351bc7', '2026-08-30 04:08:55.283853+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/3c014560-c75e-477e-becb-1c1e91e40c6e/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9c7d3934-ccc5-4ed9-89e0-b5509aced66a', '2026-08-30 04:09:16.590765+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ce2e9634-4dc4-4942-b7ba-70c046c97ff1', '2026-08-30 04:09:17.164856+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/bb4b1833-5131-44af-bcc8-f7ba80f64293', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('315e9de0-838b-4bf9-b6fc-36a3e6a110a0', '2026-08-30 04:09:18.116728+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('abe32225-051b-42a4-9943-e38cb8ce0ad4', '2026-08-30 04:09:18.649268+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'PATCH', '/admin/questions/bb4b1833-5131-44af-bcc8-f7ba80f64293', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('26b4d464-c2ad-44ef-97db-cad7d1d52a32', '2026-08-30 04:09:18.930682+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'DELETE', '/admin/questions/bb4b1833-5131-44af-bcc8-f7ba80f64293', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cd241185-29f2-40e6-a95f-fb5ee5db96c6', '2026-08-30 04:09:19.224097+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/bb4b1833-5131-44af-bcc8-f7ba80f64293', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3b9d6699-36e3-4bb0-a972-14af9b89f07a', '2026-08-30 04:09:22.82305+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('26685bef-5722-4b02-b297-62b0f2efba0a', '2026-08-30 04:09:23.09975+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7d7021f6-530e-4865-8fe9-379bd900cff8', '2026-08-30 04:09:23.388831+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9cfbd444-ab25-4d73-a255-4ee38d6b6d86', '2026-08-30 04:09:23.929222+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/5692304f-4a0e-4056-849c-e0fc069182e4', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('46bce5eb-68a8-452e-bc10-5511424cc3d9', '2026-08-30 04:09:24.754151+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cae8ed68-9858-47f2-923a-7f45ce682e88', '2026-08-30 04:09:25.452671+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tests', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bfa593de-ddfd-446c-b23e-749bb0751297', '2026-08-30 04:09:36.523681+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('917c2730-488a-4b22-b745-40f46ca2f0ec', '2026-08-30 04:09:36.675948+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b24ae277-2cbf-4b2c-9812-a4e2ac3560b9', '2026-08-30 04:09:36.839349+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/a9495496-47ae-44ca-8dfc-e9dbae5910ca/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a6d1c10f-c1e3-40bc-b88c-b76db372434a', '2026-08-28 17:30:47.304643+05:30', NULL, 'PATCH', '/admin/subjects/e4112d30-7733-4674-bc15-32b0c3695361', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('224ffda7-6de4-46ed-bb7b-69526a1e385d', '2026-08-28 17:30:47.554552+05:30', NULL, 'POST', '/admin/tenants', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7cd0fd31-9ac2-4636-aaee-f06bf02375ae', '2026-08-30 04:09:56.793211+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0a18aefc-9cda-41c6-a060-a52a31270aad', '2026-08-30 04:09:57.048496+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('aa944d07-7507-4318-99df-fe77975ffb91', '2026-08-30 04:09:57.564086+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/2673eeba-e9c5-43c7-873d-2d41c3044482/subscriptions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a1dce483-4089-4367-a058-776bdc1ef53c', '2026-08-30 04:09:57.793457+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/2673eeba-e9c5-43c7-873d-2d41c3044482/subscriptions', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a51227fc-4a32-4965-ad80-31c3bf9d6cf3', '2026-08-30 04:09:58.484089+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d8ca7f2c-aa5c-4139-98d7-e36a055be041', '2026-08-30 04:09:58.745516+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 409, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f7c07d36-4aec-430e-b303-cd542248ba1c', '2026-08-30 04:09:58.995167+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0f714310-1daf-4b3f-b2ac-7f685cb39f75', '2026-08-30 04:09:59.446754+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('37b87e64-8d57-49dc-9262-dd48aba06512', '2026-08-30 04:10:00.567059+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0cebd71c-c205-4da9-a188-9d8a1c5c8047', '2026-08-30 04:10:00.825828+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/587d3658-2035-4701-964f-f13fd5fe87be/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('70c0b073-167b-404d-967a-4f99c8669727', '2026-08-30 04:10:01.102003+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/14993aba-b853-407f-9a77-96f2266a6844/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6b4de34b-d759-4f31-9b6b-20f1fb64f659', '2026-08-30 04:10:01.384581+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/14993aba-b853-407f-9a77-96f2266a6844/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('74eb3a43-52cf-44aa-a471-c8ac288ee2e3', '2026-08-30 04:10:01.662692+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/587d3658-2035-4701-964f-f13fd5fe87be', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('da47dc84-beb0-4011-8385-03a2f5b061da', '2026-08-30 04:10:01.941614+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/587d3658-2035-4701-964f-f13fd5fe87be', 400, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1b20ed97-fdb2-49f6-8ea8-e0deb7356b4f', '2026-08-30 04:10:02.23762+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/14993aba-b853-407f-9a77-96f2266a6844', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3ab659ac-fd87-44b1-b730-f4a368a251e0', '2026-08-30 04:10:03.209576+05:30', '1417c297-2dac-4900-a51c-0d5f3fdbd0fe', 'PATCH', '/admin/subjects/587d3658-2035-4701-964f-f13fd5fe87be', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8c33c614-a14b-4525-bc83-51d59ec93266', '2026-08-30 04:10:03.439763+05:30', '1417c297-2dac-4900-a51c-0d5f3fdbd0fe', 'POST', '/admin/tenants', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3f48a283-ac77-4b7b-8c7f-013b329159aa', '2026-08-30 04:10:04.126411+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users/1417c297-2dac-4900-a51c-0d5f3fdbd0fe/password', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f64ce640-0bcc-4860-92a6-d8ec21b45603', '2026-08-30 04:10:27.350443+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('acbfa14f-fcda-4c32-ab6a-f21230d9b660', '2026-08-30 04:10:32.134104+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5f703b97-b534-4456-adde-72a4ca3db444', '2026-08-30 04:10:32.603626+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c0f523c0-f822-42df-a2ea-9e89f6a0589e', '2026-08-30 04:10:33.029443+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bb5e6e3d-8504-4be0-807f-04f23a101a67', '2026-08-30 04:10:38.388226+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('65d59594-5909-4fef-b60e-8f584648638c', '2026-08-30 04:10:38.839982+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f7414199-c6e7-4ef0-b720-550ab7ee7a73', '2026-08-30 04:10:39.331594+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e13dd521-4694-4039-9fad-f9eff981b2b0', '2026-08-30 04:10:39.827632+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/08b34d0e-6dd5-4740-ae31-aa02bc4da05a', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0d205997-63aa-4c28-bb15-33d206eca7fb', '2026-08-30 04:10:46.717958+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4d4aefba-77ea-41f5-a993-4669e31411b7', '2026-08-30 04:10:49.829667+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ef0c34e6-e197-454e-87df-2f6579d7ce04', '2026-08-30 04:10:51.215175+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d02e9428-bd4b-476b-8fad-5b986fcf70af', '2026-08-30 04:10:51.541185+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('89b2aa7f-b865-4ad2-af81-a365beff96d2', '2026-08-30 04:10:52.388026+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/817ef851-1b4c-4cd2-a7b8-b90b36a181fc', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9d8182a6-f973-4736-a887-a18ddaa3f04b', '2026-08-30 04:10:56.261893+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/ingest', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('388d491c-0b75-4b64-8844-2d41a9b18a1b', '2026-08-30 04:10:57.628985+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d9255607-3f7c-4dbf-8513-53881552ec07', '2026-08-30 04:10:57.730598+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/ingest', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1185d7cd-f9a3-471f-bc61-29cda26b5575', '2026-08-30 04:11:01.175178+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6bf6c616-1ffe-47e3-9432-cc8f30a382c9', '2026-08-30 04:11:02.384026+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/11f8c7a6-c0a1-48bb-83b6-7f3031c780b6/media', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('389b08df-8ee1-46d4-80e4-cabd1c2525de', '2026-08-30 04:11:04.570569+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/questions/11f8c7a6-c0a1-48bb-83b6-7f3031c780b6/media', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d2f7b455-b867-4d6b-9057-e755b6c0a27b', '2026-08-30 04:11:09.509674+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('334358e1-3beb-44a2-a0f6-42d1fccb3e10', '2026-08-30 04:11:10.321977+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3481b048-edbc-49c5-b6f4-1707efbc527a', '2026-08-30 04:11:11.214106+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8ceb8412-61ed-4ac5-ba3f-f63a0583e370', '2026-08-30 04:11:12.06646+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/8310bac0-69c9-475c-9f5d-3c489a03a8af', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c22fa9b2-4763-47e9-9bce-cbbf223ea814', '2026-08-30 04:11:16.919939+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/adb5aef5-06bc-4c51-a344-b88bcb5b6922/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b74bf9d3-cd90-4fcc-9329-b66861bf225a', '2026-08-30 04:11:17.504229+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/54bb68e3-55fb-462c-8839-68131d786b63/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('05fc2253-189c-418b-aa4e-110ca2248024', '2026-08-30 04:11:17.943246+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8a55e6d6-88a2-4cfb-b81b-369acdc56a2b', '2026-08-30 04:11:18.811372+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 422, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8f8639d6-e2f8-4de7-85ad-b4af2dc7a587', '2026-08-30 04:11:19.243867+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/94024ef5-fc36-47d4-824e-b29cb5eceadb', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('51995595-1fe2-42c1-9e0e-b2f94e951d1a', '2026-08-30 04:11:20.570084+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/adb5aef5-06bc-4c51-a344-b88bcb5b6922/topics', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1acaa9e4-78c4-479d-babf-9e3909e37100', '2026-08-30 04:11:20.989564+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/94024ef5-fc36-47d4-824e-b29cb5eceadb', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6dfe40b3-344c-45f6-9d1a-9f34d01fe659', '2026-08-30 04:11:21.871931+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/questions/94024ef5-fc36-47d4-824e-b29cb5eceadb', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b82f37b1-f920-4630-bc48-e63c7763736b', '2026-08-30 04:11:58.534638+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/users', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b4634dea-c9c6-4f0b-be81-4232d2bc02a3', '2026-08-30 04:11:59.342384+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/subjects/3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bce09380-b22a-45bc-b39f-173eff743779', '2026-08-30 04:12:00.508122+05:30', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'POST', '/admin/pyq/bulk', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('751f7c28-a582-428e-b8f7-395e02b3f24e', '2026-08-30 05:10:29.923967+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ab004ca6-48c3-4586-8b11-3f82ea3e9723', '2026-08-30 05:10:30.112171+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/63e5642e-20b6-4089-bdc2-a7512d5a8493/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d0839337-edb1-4a74-9954-1408698056ff', '2026-08-30 05:11:18.247523+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b031806e-cc2f-44e2-9cb9-b7d57c708101', '2026-08-30 05:13:02.447674+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3bfd86fb-71a1-44fb-a48e-9119a20a31d6', '2026-08-30 05:13:10.277543+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('02ee14d7-8144-468b-aa2f-a05c805771c9', '2026-08-30 05:13:15.324314+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('783b4490-53e4-4bda-83b0-c3449f052f63', '2026-08-30 05:13:35.533924+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a9b227ac-dc66-426f-b993-bdcbe13466ba', '2026-08-30 05:13:35.725795+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/subjects/632d3188-45b9-446d-86a8-08be19e6eb4e/chapters', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d508901b-aab9-4824-a088-5b830aa8826a', '2026-08-30 05:13:35.92712+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0b7c0106-4854-4eab-a0b5-6ff39c94e699', '2026-08-30 05:13:37.749594+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('80ef2de9-f250-415e-8af8-e50b891f5591', '2026-08-30 05:13:39.390296+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0c2d3101-ea10-48b6-bc22-5850d6841522', '2026-08-30 05:15:08.035468+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1074bd10-c6d6-4469-a828-404aa4d8030b', '2026-08-30 05:15:19.683583+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8d0baaf5-007c-4ba9-98fb-bffda59950e0', '2026-08-30 05:15:55.014724+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f5d79c1d-2c6f-48cc-8cb8-f0eb0bf76b0f', '2026-08-30 05:16:28.392884+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('33b8c34f-50cf-4232-9e2c-a36233db8bfc', '2026-08-30 05:16:39.820354+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('344c671d-eb14-44de-b7ab-2228cffb79e1', '2026-08-30 05:17:17.595665+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5688fa18-28d5-497e-9103-b104475ef3b8', '2026-08-30 05:17:22.666131+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('76ed864d-5316-434c-83b0-e7d5e7d92061', '2026-08-30 05:21:54.351536+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8e43becc-1fff-44cf-a680-f95483076424', '2026-08-30 05:22:02.006499+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fe7e3d66-aeda-4c43-8072-24edf8c71437', '2026-08-30 05:22:07.22935+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8b374c79-afde-4b88-b4eb-86fe09ae2a26', '2026-08-30 05:35:27.174977+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('243858f8-0640-4bbc-a01a-d855d61e3da3', '2026-08-30 05:35:31.438039+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5a1589ce-0d7d-4a75-a7db-912c1ac52baf', '2026-08-30 05:36:05.360737+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6565edab-f85e-4618-a621-fbec813f4e19', '2026-08-30 05:36:42.561857+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0aaac7c5-b782-4e17-a9b6-ee8c07f1324d', '2026-08-30 05:37:17.110139+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7983218e-9106-4176-afd9-838715245409', '2026-08-30 05:38:13.44699+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tests', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('98a69ef9-ff36-4a8c-a9bc-6fe41f0305e7', '2026-08-30 08:09:01.518474+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('342a7769-c3b6-48c5-9bc2-cfbbd8d426e0', '2026-08-30 08:09:08.026122+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('449a1245-47cb-4af6-8aad-92c37f1302be', '2026-08-30 08:09:13.249747+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eefbac20-cc35-4126-98b8-9939ae0f1cc8', '2026-08-30 08:24:43.268232+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('72746220-30b8-4424-870b-a52d5f0150ad', '2026-08-30 08:24:49.900255+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('dd452d34-ec01-431c-a24c-f472293e3ec4', '2026-08-30 08:24:55.196784+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ef1327c8-7afa-47d2-869f-5f69c257823f', '2026-08-30 08:37:41.098328+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('02fda7cd-b70c-4350-9409-57f7837a44ec', '2026-08-30 08:38:46.026312+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b781dfcf-1132-40ec-b636-2496325453eb', '2026-08-30 08:39:43.031105+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('42e3307e-0c7c-49d8-ac16-6f7ba7fb4f97', '2026-08-30 08:39:49.642212+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6008536c-a5ba-4529-8180-9e931a449af5', '2026-08-30 08:39:54.900745+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7032e985-ccb3-4d2c-b0ac-49110b7a7c07', '2026-08-30 08:52:30.008664+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d07c8596-063c-41f2-8094-d2df2b680354', '2026-08-30 08:53:01.789095+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ff82586a-0831-4a3a-8788-f686fbd86a2f', '2026-08-30 08:54:17.799864+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8c2ed356-43e4-4564-866c-35b3e9e21585', '2026-08-30 08:54:24.644346+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ad0481c3-9042-4818-9f91-2eafc2478904', '2026-08-30 08:54:29.736609+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('fefe7e6a-67c5-4a60-9f08-a770f0ea2062', '2026-08-30 08:54:32.235501+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('33520ef9-3b13-47b1-a4b6-932e538ce20c', '2026-08-30 08:54:50.744521+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('851cc422-907c-4885-bb33-9f0aa97afc56', '2026-08-30 09:15:54.510459+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9b678cd4-6d18-4c65-931b-e5f4bb2f7b7b', '2026-08-30 09:15:59.591155+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('182e884f-99ac-4b49-a768-55dab92f12af', '2026-08-30 09:16:02.135215+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2d738de1-f67e-42b7-865e-75752d1bc5eb', '2026-08-30 09:16:28.640335+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4521dea9-d86a-48a4-9e58-ce31887a5ea3', '2026-08-30 09:16:44.284402+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7014b73e-3530-42ca-8403-1091648509e3', '2026-08-30 09:25:52.397381+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e74bc391-2860-4125-9192-432c7b4ad0fa', '2026-08-30 09:26:23.738589+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('8f890d52-03c4-4d14-9912-bcfb385ee450', '2026-08-30 09:27:28.997839+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('15c5dc25-0771-4f89-9e5e-d2d22ab7b5ed', '2026-08-30 09:28:34.153617+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('87da3bb8-4371-4e54-beb7-e2cf91f8efa9', '2026-08-30 09:30:13.807002+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('54474a9b-619b-4bb7-9e00-604f3c2760a7', '2026-08-30 09:30:47.21895+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('87d0cdbb-a534-41e0-b7fa-f55f70c7f471', '2026-08-30 09:30:49.291884+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('47ec81a6-ffff-4bdb-9d95-ede967c5a5b0', '2026-08-30 09:31:12.593428+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f0296ae4-d002-4286-8fbc-76dff6da593a', '2026-08-30 10:01:13.373265+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('5c300ed4-9d3f-48c2-b0de-06de89485086', '2026-08-30 10:01:22.223272+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c02b5f6b-b951-4e84-b1f0-694ec37d9e7a', '2026-08-30 10:01:56.449597+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3a7d5957-4621-4212-829a-c19692b7a7f1', '2026-08-30 10:02:33.504665+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('597bc852-ef35-48ac-8180-98f88c1e7ab4', '2026-08-30 10:04:40.767055+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ab4f8be0-e06c-4e8a-8e29-afc4676888b8', '2026-08-30 10:05:15.715143+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b31b5316-f21c-4cfa-9216-aa13917b20cc', '2026-08-30 10:06:20.746634+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0cd7c80c-ef8b-4516-9336-b816475d18d2', '2026-09-10 13:23:55.839751+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/fff653c7-0029-45f2-897c-586de430efe7/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6dba0553-fb47-4f64-ba10-599473938b76', '2026-09-10 13:25:53.20366+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/fff653c7-0029-45f2-897c-586de430efe7/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e0a89e5a-f52e-4356-a653-f3a4fe4fa975', '2026-09-10 13:30:02.410746+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/chapters/fff653c7-0029-45f2-897c-586de430efe7/modules', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('238a0ed7-74aa-4a8e-b076-b35d77b669c0', '2026-09-10 13:30:08.05195+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/modules/a96b71b1-8849-4f7f-8005-6ecdfd823237/video-upload', 202, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('84a6f41d-1a3b-43dd-9746-af01b752ef6a', '2026-09-10 13:34:38.170789+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/modules/a96b71b1-8849-4f7f-8005-6ecdfd823237', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9dad9d5e-adbc-4ddb-9092-c23664b67536', '2026-09-10 19:20:07.80211+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/ec4f67ac-db65-4d78-96e4-0b70fb7529ce/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ab5f6b05-989c-4463-8f0a-c013696ca134', '2026-09-10 19:20:09.969148+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/ee625112-d811-4f69-a097-f61c349f05a1/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('648747c5-9a95-4f18-94ed-f2f1eb151a36', '2026-09-10 19:20:10.672844+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/a4690851-6569-4fe9-a46c-a7f29c1e85b8/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a7b297f2-7905-4b2e-a198-675cea8ce84b', '2026-09-10 19:20:11.697235+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('3a1e3ec9-88b5-4008-8992-82e023d8ba30', '2026-09-10 19:20:11.953087+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/ec4f67ac-db65-4d78-96e4-0b70fb7529ce/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2634df9e-fb8f-4842-816b-c629f51c279e', '2026-09-10 19:20:54.810498+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/34c83969-7752-40bd-a6b7-3f532f68e298/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1ee2a1fb-52a3-4874-a3ec-e49481cbd4fa', '2026-09-10 19:20:56.900462+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/49f6bc52-a9a3-479f-9bf8-2a478dd3f996/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('19ce11c2-7f66-4b6d-9e7d-764f584bd91f', '2026-09-10 19:20:57.62482+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/32078bcb-8b71-451e-a5b8-ce966342b646/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('df62c0f8-2693-4f70-b6ae-3af1e00192b3', '2026-09-10 19:20:58.565151+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a19ca717-9b9b-470e-b915-32932fe9f6b0', '2026-09-10 19:20:58.810843+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/34c83969-7752-40bd-a6b7-3f532f68e298/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('0f0b9828-11cc-4067-8bce-31520d895ce5', '2026-09-10 19:41:40.973683+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/6ae384fe-4f42-4a23-b8a0-86a7d9c65412/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('63f88f00-f12d-4098-ac4c-375f829141d1', '2026-09-10 19:41:43.908728+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/73f817de-55d7-4bbc-b8c6-925ed5694a3b/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2dab2ee8-2bd1-41f6-8191-81e0561a733f', '2026-09-10 19:41:46.111768+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/e7e52298-254e-4da4-81a2-fae46df6f88a/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('cebeba5b-85a8-438c-a5db-f107067b0bea', '2026-09-10 19:41:47.578113+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('226ed5e1-eb7a-4269-ba37-59509b3d5ca9', '2026-09-10 19:41:48.00205+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/6ae384fe-4f42-4a23-b8a0-86a7d9c65412/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f6fe72a3-f84b-4165-b160-c6580ab6cec3', '2026-09-10 20:01:57.205473+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/6422ae52-a9ad-41f4-8d9b-d23b82a66529/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('921003cd-b574-4787-9cf4-4732a8070b29', '2026-09-10 20:01:59.40189+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/1edce3e4-e48c-4218-b6aa-5de269d93791/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7d1f42c9-7b2e-4600-9d70-b0e3ecaf6b8a', '2026-09-10 20:02:00.169208+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/4ab83af8-694a-4bd7-975d-66e6eaba4934/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('eda8a073-7fbe-4fdd-8113-910485ee7295', '2026-09-10 20:02:01.249585+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e7e72d81-f1eb-4b49-8548-8325189e03d5', '2026-09-10 20:02:01.548501+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/6422ae52-a9ad-41f4-8d9b-d23b82a66529/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b391d168-f2ee-4879-a779-953ac92c6661', '2026-09-10 20:03:00.665967+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/917f729d-1209-4c30-a9bb-a86e2bca9a15/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7d0a69fc-d069-47d4-bf9b-0bb0f7a9e953', '2026-09-10 20:03:03.585712+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/04b72fc6-bcc1-42fb-8bd1-d57db0d8e4da/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('303cc78a-da62-47e7-b4a7-091d4ad60bd3', '2026-09-10 20:03:04.605623+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/95592210-31e4-4427-82e1-ba1b0a6b7991/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a6706854-5b4c-40d8-9945-6270e045b09c', '2026-09-10 20:03:06.018034+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('181b0711-6397-4b7d-8227-78be53babab5', '2026-09-10 20:03:06.473977+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/917f729d-1209-4c30-a9bb-a86e2bca9a15/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f6876419-6742-4dcb-a527-d4547bd68277', '2026-09-10 20:31:37.033153+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/8fbeef05-35a8-4605-a7c4-89487a2f4037/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('6b6c6e63-c282-4fc7-a482-bde3b22a1944', '2026-09-10 20:31:39.395369+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/f228df7b-a8b2-4f64-8552-404b74c21a58/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e879f7e6-059a-4681-b9f4-6b60dc8bab7d', '2026-09-10 20:31:40.468724+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/0f20d2b1-500f-4926-9f2f-590a17c1d653/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7943eb1f-f2b2-409d-912c-464d12cd5766', '2026-09-10 20:31:41.973901+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('dd0dda25-b168-403f-9869-59555e307c48', '2026-09-10 20:31:42.430277+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/8fbeef05-35a8-4605-a7c4-89487a2f4037/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e0d55b38-7d4b-4555-baae-d02eb5a91ed7', '2026-09-10 20:39:08.250426+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/4643b6b8-e280-465b-8ef9-ca49f8557574/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('d55a172e-4b15-4610-b149-8bffb01bb8b0', '2026-09-10 20:39:10.334147+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/70d91789-c2f8-49a1-a5ad-d3a7f80118cf/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('32622e32-959d-4e55-ad14-55642085f3b4', '2026-09-10 20:39:11.108455+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/937d3e6b-72cb-4652-98e8-0f8aa42b2362/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('008cb9c3-ace7-41ed-be57-607f2a2d6888', '2026-09-10 20:39:12.147712+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('052d9317-5f05-4f61-aca6-b544540a37cb', '2026-09-10 20:39:12.518091+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/4643b6b8-e280-465b-8ef9-ca49f8557574/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('699fc8cd-7385-40b8-9f97-2ca4fcb4b686', '2026-09-10 20:44:22.803876+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/bbfce0ef-e1cb-4818-a121-5aaec679dbe6/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('bd20f1b8-cac9-4bb4-ac02-e198ed9de4bc', '2026-09-10 20:44:25.50485+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/68260a69-d8c8-4ed2-983e-62e6286bc0fd/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('9d30c72c-96ce-49b5-8d70-2640d36a2f10', '2026-09-10 20:44:26.529515+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/065c18b0-49f8-4379-ad62-7b8b8869d0f5/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b7622683-3417-4db1-8415-3291c373cb2a', '2026-09-10 20:44:28.055497+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('67be3974-611d-4308-bf55-2912ddf85581', '2026-09-10 20:44:28.501594+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/bbfce0ef-e1cb-4818-a121-5aaec679dbe6/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('20b93dbd-5a8e-4602-99da-60d84ad6d285', '2026-09-10 20:46:07.69593+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/93182cbc-63da-4944-b1f8-bde5afe35155/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b64ed570-0d83-4127-88c5-10eb115dbb9a', '2026-09-10 20:46:10.868171+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/4eaf0aef-1e59-446d-99d8-c174f9ce8e22/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7f65fc20-6954-4bcf-86a1-6261fee40de4', '2026-09-10 20:46:12.925076+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/e788ce5d-1b94-4791-bc29-edfe229dc246/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('7ddd86e5-0fdf-47b4-86fb-822fe0026dbf', '2026-09-10 20:46:14.373889+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('10f20bae-c280-41b5-b176-75c6e14b5071', '2026-09-10 20:46:14.930406+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/93182cbc-63da-4944-b1f8-bde5afe35155/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('69c6b76f-4d99-44a0-b059-91970570f1b4', '2026-09-10 20:58:32.742251+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a22303fb-7ce7-4c9d-860f-78071bfbde26', '2026-09-10 20:58:49.02355+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('a0c633d6-3dfd-436f-aed8-f6bfea21ea24', '2026-09-10 20:58:56.449352+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('67a2dbdf-de6c-415c-ac45-944e35842dec', '2026-09-10 21:02:38.924736+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('86713504-1e77-4c31-b5c7-0ec74438bd1f', '2026-09-10 21:05:26.087952+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('13ff5666-fdd8-41df-b061-842575b48abe', '2026-09-10 21:05:40.54374+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b362797a-e273-4af1-8751-f4132ebaa064', '2026-09-10 21:05:57.917747+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c15c7e15-383c-4cbf-9e92-f4ad3329d549', '2026-09-10 21:05:58.4412+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/questions/5521ec78-843c-4460-b7e1-29298c46d456/media', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('728df113-dce3-485d-8f34-a382bb741bf6', '2026-09-10 21:06:09.33062+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'DELETE', '/admin/questions/5521ec78-843c-4460-b7e1-29298c46d456', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('f38172f0-68b9-4355-97d5-f343afd5ae80', '2026-09-10 21:07:08.717303+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/695bb538-44f6-46a4-8708-bfbab0491750/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('aef1b294-e035-4ae9-9d3c-9a336a7e90e1', '2026-09-10 21:07:10.75113+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/79beb589-b7fb-43ef-8b9b-e3ea05916de1/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('2dbf7c67-31ff-4ba4-bf51-ca6331ed1061', '2026-09-10 21:07:11.471018+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/activation-keys/ecfb17e6-bb91-46a8-981d-18e754bb6315/revoke', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('75336834-224e-4377-89ae-5c84870de55f', '2026-09-10 21:07:12.365823+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/76702573-3bbe-4f30-b55e-0aa08213ae2d/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('e9117d5b-f2e5-495f-8f00-708d789b8418', '2026-09-10 21:07:12.602334+05:30', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'POST', '/admin/tenants/695bb538-44f6-46a4-8708-bfbab0491750/activation-keys', 403, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('4b775ec6-8703-4d6a-bafe-8e5bdd7e5c5e', '2026-09-10 21:07:26.175232+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('63397934-cea6-44cd-8dc8-051d4d971882', '2026-09-11 07:29:35.430863+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('ad78a5b6-49a4-4eab-bdc4-7f7d20fe80dd', '2026-09-11 07:40:49.53265+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1436c8c4-9be3-48aa-a4ad-2f63312be66e', '2026-09-11 07:43:56.99819+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('733afc34-45da-4b2a-81b8-456ab6d71ee4', '2026-09-11 07:45:19.773974+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'POST', '/admin/tenants/e75291f5-7558-4d40-aa97-9e7a94cacf7f/activation-keys', 201, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('c6bbf1fe-2ed4-4d81-96ae-97ab98bb442d', '2026-09-11 12:05:11.847501+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/728c369b-303b-4f08-b3ee-19ab8cdcd703', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('65b042fd-2a0f-41c8-a4bc-acac35840673', '2026-09-11 12:05:11.972203+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/3ac8b215-4403-42f4-8a8a-8928092f0136', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('b9f3810f-a457-4365-b619-172e08a4191d', '2026-09-11 12:05:12.086317+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/728c369b-303b-4f08-b3ee-19ab8cdcd703', 200, '127.0.0.1');
INSERT INTO public.admin_audit_log VALUES ('1b495165-0f48-48d3-b4aa-31a6437496ca', '2026-09-11 12:09:46.306996+05:30', '4067a40f-8539-41f9-862c-571c6ce2960c', 'PATCH', '/admin/chapters/1595ab67-66b1-4d3e-b8d2-594466190d7d', 200, '127.0.0.1');


--
-- Data for Name: authored_question_media; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.authored_question_media VALUES ('195c505e-4aeb-419a-bbdc-827f03b977ac', '9c9dc17b-64b8-494a-a1ae-ced5a8bac511', 'question-media/9c9dc17b-64b8-494a-a1ae-ced5a8bac511/6f5abb80759ea637bffaff38dcc7c435.png', 'test.png', 'image/png', 108, NULL, 0, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-09-10 21:05:57.979359+05:30');


--
-- Data for Name: authored_question_versions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.authored_question_versions VALUES ('478dd2bf-0877-4e2a-886b-1297c12680dd', '3adfb229-4ade-42e2-929e-d0a4dbbbcfeb', 1, 'MCQ', 'For some integer \(m\), every even integer is of the form', 1.00, NULL, '[{"key": "A", "text": "m", "correct": true}, {"key": "B", "text": "m+1", "correct": false}, {"key": "C", "text": "2m", "correct": false}, {"key": "D", "text": "2m+1", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-28 17:05:06.803619+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('4da5f8b7-cc3a-4a7c-b607-bdfb5991c6fe', '40ff370d-7d80-4721-870c-8fd19007dc1b', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:02.400671+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('d799b8ae-126a-4f03-9540-cc60a2aaecef', 'cefc546f-55e5-4aa8-bf4d-41ff7cc3fca0', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:15.281865+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('09594270-30e7-4c9c-9b45-58f8d9813790', '9afd8f8c-3e6a-4949-ade4-aa8e912b6632', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:15:19.645895+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('1eb0bfb8-0c69-4683-91df-2e572c80158d', 'b0c5a453-6a40-4400-8894-5a1759cb2718', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:16:28.348615+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('56179dc5-b77a-492b-9829-fb7654a2e3ff', '436fbd48-6187-41f6-8860-e17bba7bce07', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:17:17.55056+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('1f9b5d1b-7d25-4254-8145-741a6caab935', '4eaf49af-f32d-4be0-bbcc-42432b806802', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:21:54.309418+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('bca3d161-caff-464f-a3e5-8398eda93a06', '5d05c007-f461-4bdf-a940-94c4648dbec0', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:22:07.185491+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('2110d48b-3323-4cf4-88f9-a496b1e220fb', '1f2c0bec-f1b9-4070-b602-9a7cbb6e7381', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:35:31.402689+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('f7b0666d-0ad8-4370-93e1-66c172075228', '6c832b36-bcc8-492b-9302-0e2d831d606e', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:09:01.346286+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('f87fca27-38b0-4d2e-ab77-4ca2f7ddddc9', 'fd4e5be1-3c9f-4cd0-bde3-789da9586dfc', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:09:13.206179+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('032aba31-d647-402b-a5a4-91e9df3d9956', '02a3ae2a-fe4a-40a3-b74c-931a3b984d2c', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:24:49.855986+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('d4ffd50f-d69b-42b6-bec7-3571fd888ff8', 'fa4ca2e9-5135-4332-b52a-952effcdae39', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:37:41.056583+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('003b1c19-c3ee-452f-8a83-9df7519542bb', '021f12a6-3723-47c9-80e7-ab5539f9cc2d', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:39:42.990073+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('04f17b35-785f-4f84-b6d6-c974acab0809', 'c42ee619-c3aa-4e10-abe4-efd4d16c9c72', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:39:54.746592+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('dee565c2-007a-43c8-bfec-b77e6b1eeed7', '720e9dbc-5f7f-4d74-a957-e724ff669644', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:53:01.751847+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('256504c6-45eb-4c0b-9075-1fe11a950c37', '8e9419f1-b29f-40c2-b569-ce01bd3c2754', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:24.599677+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('593953f7-3402-4319-9d65-585a4a72ce31', 'e16f2152-46cc-46c0-bc6c-accdde61edc7', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:32.193508+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('99c0c0a2-e157-46de-945b-f9ec1cd52614', 'd6bcdd09-7954-412e-b251-51fdf4ce09c8', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:15:54.366138+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('974257bc-c420-4a42-91ae-b2bf6938b780', '5bfd4149-6d19-4932-894e-36afe2f8dd0a', 1, 'MCQ', '<p><strong>Find the distance between the points (0, 0) and (36, 15)</strong></p><p></p>', 1.00, NULL, '[{"key": "A", "text": "<p>39 km</p>", "correct": true}, {"key": "B", "text": "<p>20 km</p>", "correct": false}, {"key": "C", "text": "<p>15 km</p>", "correct": false}, {"key": "D", "text": "<p>23</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-29 09:07:02.659633+05:30', NULL, '<p><em>d</em>=(36−0)2+(15−0)2​=(36)2+(15)2​=1296+225​=1521​=39</p>');
INSERT INTO public.authored_question_versions VALUES ('a898e108-5872-420a-a2af-ff543953000b', '36d19174-bf57-4bbb-bdf9-b7a9d3d5ef8f', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:16:02.093387+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('144dc9ea-62ad-4b93-a282-2d947b6029aa', '9d781e9e-cc63-4fbf-b8ce-5a26cd035bf1', 1, 'MCQ', '<p>Header button check</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:16:44.24458+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('c80366cd-d696-4f15-a7d5-69de97184310', '05b6eeb5-8479-4644-b196-df27074c17b7', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:26:23.68917+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('200cb570-4793-465f-867a-b80853dba33b', 'c752dc71-e24f-47bb-8401-8d466f6fcc16', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:28:34.114598+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('5940f8a2-8f49-4114-94bb-5c7fa1832d63', '9a14d4ac-6075-4d20-bdde-eb73de68048e', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:30:47.185402+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('1557e73e-7b1c-49a5-99cb-cbad9b318e8d', '95f19a83-802a-4656-998a-b680e87bcad2', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:31:12.556193+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('024d9a93-456d-4838-86af-1e0eb0d5491c', '8ddf3142-bca1-4de3-a1e2-cb9e3e1da067', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:01:22.177429+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('0bb3fac9-aea1-4571-94ab-b743345a8094', 'fbe6aa5b-8b37-40d6-a9f9-3c35363e1834', 1, 'MCQ', '<p>Debug add new question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:02:33.464284+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('c8b975ae-b4f8-49cb-900e-a92f1f415d61', '66c164b9-42f0-492a-803f-9be83687aeb1', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:05:15.672197+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('6cdc82d8-3e3c-4a6f-a6ca-8475af696baf', '961c62e5-2326-464b-a97e-145c1382820a', 1, 'MCQ', '<p><span data-latex="AB=  (6−5)  2  +(4+2)  2   ​  =  (−1)  2  +(6)  2   ​  =  37 ​  " class="qmath"></span></p><p><span data-latex="BC=  (7−6)  2  +(−2−4)  2   ​  =  (−1)  2  +(6)  2   ​  =  37 ​  " class="qmath"></span></p><p><span data-latex="CA=  (7−5)  2  +(−2+2)  2   ​  =  (−2)  2  +(0)  2   ​  =2" class="qmath"></span></p><p>Which option is correct?</p><p></p><p></p><p><br></p>', 1.00, NULL, '[{"key": "A", "text": "<p>24</p>", "correct": true}, {"key": "B", "text": "<p>26</p>", "correct": false}, {"key": "C", "text": "<p>23</p>", "correct": false}, {"key": "D", "text": "<p>28</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-29 12:44:20.409504+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('b3f5cdbc-2059-48c0-89d4-046e7255ee62', 'd80a9487-449b-44b4-9d07-62048fef1e3c', 1, 'MCQ', '<p><span data-latex="AB=  (6−5)  2  +(4+2)  2   ​  =  (−1)  2  +(6)  2   ​  =  37 ​  " class="qmath"></span></p><p><span data-latex="BC=  (7−6)  2  +(−2−4)  2   ​  =  (−1)  2  +(6)  2   ​  =  37 ​  " class="qmath"></span></p><p><span data-latex="CA=  (7−5)  2  +(−2+2)  2   ​  =  (−2)  2  +(0)  2   ​  =2" class="qmath"></span></p><p>Which option is correct?</p><p></p><p></p><p><br></p>', 1.00, NULL, '[{"key": "A", "text": "<p>24</p>", "correct": true}, {"key": "B", "text": "<p>26</p>", "correct": false}, {"key": "C", "text": "<p>23</p>", "correct": false}, {"key": "D", "text": "<p>28</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-29 17:17:53.614748+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('ba035cbd-8acb-409f-b087-8619cb5b4ba4', 'f7dc79f7-08c2-4216-8e05-39b70f0ae363', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:11:18.189199+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('32e905e6-32c0-48e1-a1ea-2806ac5a0944', 'ecc54982-48bb-4749-b2b6-6f4645080ecf', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:10.232147+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('e9298616-53c8-4492-a3d5-674828d09632', 'de04f76d-6891-4765-b157-463e607700db', 1, 'MCQ', '<p>2+2=?</p>', 1.00, NULL, '[{"key": "A", "text": "4", "correct": true}, {"key": "B", "text": "5", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:35.881542+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('234658e3-9652-46c7-bdde-16107d1456f3', '52ad6b2c-ee95-4488-b411-fe4f77af0534', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:15:54.87444+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('6d5c1cee-8724-468a-bf35-9f7bf196c66d', '733424f8-a0ef-40a3-878b-ff9c9d5bc7a8', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:16:39.780243+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('dbc6037d-93c1-445d-a30f-0fada64b8d50', 'c1305133-e849-4e9a-9b1a-bd3f9b84c7bf', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:17:22.620557+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('ddae1ed3-7bd0-4863-9c16-183e1458eb91', 'f2762a4d-9e0f-4dd8-96cd-dfd032e6cc3b', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:22:01.965851+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('404a659c-64a6-4d2e-a474-0331a7633fa3', 'f5541351-bfd0-4bc6-b1da-f791cfdf2499', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:35:27.141025+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('d5154021-2c12-4350-8b7d-28e8d8c15688', '6f059d50-4764-4dd9-af9e-09a3c06cf60c', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:36:05.32506+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('50a628b6-715b-496c-ae24-24ee7bb5ca0b', '876ae281-7f99-44b3-b9fd-94815152e468', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:09:07.980027+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('5b547ad6-b27f-4953-8447-39589478859b', '2652a837-1ed9-4281-ae9e-2fa7a09f5bf1', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:24:43.219066+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('4ee7dd1a-0053-4669-a197-49095119840b', 'b043ad5e-4b5c-4a99-bc9c-90c2f1a8fcbd', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:24:55.154028+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('bfa74f19-db66-41d7-9bf0-a1c1c41bcba6', '1ebe30c3-058e-48a9-9c74-965796f45c31', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:38:45.989226+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('a6ac14fa-28d3-4006-bd13-5e4e6c74be77', '2327d712-dc43-4b34-a084-902a83121635', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:39:49.593933+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('73c681f9-cea8-463c-8384-ecfccd740fe8', '0c53349c-8ff3-4d35-9ab4-8f96e669ea85', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:52:29.970633+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('f92d4d51-ffab-4d69-9058-7117a60a710c', '54f5451b-bf63-49a7-be81-e6b48b752195', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:17.754471+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('b56cc7f6-aee2-4dec-ad84-d43aa4dfb376', 'df9f735e-0625-4485-8510-ba0755f6945b', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:29.695135+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('a66a7ba9-6f92-4992-8b10-611e162fdf26', '1414d9cf-cac9-4652-b196-7a9792646e65', 1, 'MCQ', '<p>Visual check for success state</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:50.699678+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('cd962c25-f507-48e9-87fd-6da455ca0d74', 'de9db4aa-c353-4cb5-b76a-52ba4f2d12f1', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:15:59.545753+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('1f3ad07f-c30b-4a5d-86ce-0243dbe22b21', 'a38a74ee-8618-4768-86b2-6966410ae5cf', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:16:28.596863+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('52a7f609-035f-4c17-96e9-5bd65033a473', '167b0575-c3f2-4623-9e46-bbd13fd7cb23', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:25:52.249908+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('f5af2208-3442-4524-ace5-dabf87b64b94', '58de6ee1-8b3d-4baa-b043-73f503dc7f74', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:27:28.964688+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('4bd6e7d7-5516-49d5-af06-5eae62d7459f', 'deb3d75a-9c0b-43da-b7ff-659a4cec13e8', 1, 'MCQ', '', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:30:13.767472+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('5b3d98d6-c405-427a-8611-fb8113a12db1', '1f1c701b-a7fd-4d87-85a4-daa0efb2c1ff', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:30:49.255506+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('8463576a-1d29-46df-a066-767420f90905', 'b06a63b6-5977-438a-bc61-39c3bdda235b', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:01:13.32806+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('19f00db7-2f32-4ae6-bd2f-c02f66b166ca', '65a9c536-403e-4d8e-9b59-ae0865c1a3a2', 1, 'MCQ', '<p>Gated publish question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:01:56.403144+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('acf4214a-c800-4e7d-89c7-dbcb5a8cd6a9', '39078667-719d-4be8-b9db-1e66831e5a4a', 1, 'MCQ', '<p>Solve for x: <span data-latex="x^2 - 4 = 0" class="qmath"></span></p>', 1.00, NULL, '[{"key": "A", "text": "<p>x = 2 or x = -2</p>", "correct": true}, {"key": "B", "text": "<p>x = 4</p>", "correct": false}]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:04:40.716286+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('bc8e338a-0b14-4465-98b3-f083f8411173', '88906b03-b506-426c-9c04-4dfa4a1ed041', 1, 'MCQ', '<p>Success state question</p>', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:06:20.708269+05:30', NULL, NULL);
INSERT INTO public.authored_question_versions VALUES ('9c9dc17b-64b8-494a-a1ae-ced5a8bac511', '5521ec78-843c-4460-b7e1-29298c46d456', 1, 'SHORT_ANSWER', 'smoke test question', 1.00, NULL, '[]', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-09-10 21:05:57.854965+05:30', NULL, NULL);


--
-- Data for Name: authored_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.authored_questions VALUES ('f2762a4d-9e0f-4dd8-96cd-dfd032e6cc3b', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'ddae1ed3-7bd0-4863-9c16-183e1458eb91', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:22:01.965851+05:30', '2026-08-30 05:22:01.965851+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('5d05c007-f461-4bdf-a940-94c4648dbec0', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'bca3d161-caff-464f-a3e5-8398eda93a06', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:22:07.185491+05:30', '2026-08-30 05:22:07.185491+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('f5541351-bfd0-4bc6-b1da-f791cfdf2499', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '404a659c-64a6-4d2e-a474-0331a7633fa3', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:35:27.141025+05:30', '2026-08-30 05:35:27.141025+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('1f2c0bec-f1b9-4070-b602-9a7cbb6e7381', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '2110d48b-3323-4cf4-88f9-a496b1e220fb', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:35:31.402689+05:30', '2026-08-30 05:35:31.402689+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('6f059d50-4764-4dd9-af9e-09a3c06cf60c', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'd5154021-2c12-4350-8b7d-28e8d8c15688', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:36:05.32506+05:30', '2026-08-30 05:36:05.32506+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('f7dc79f7-08c2-4216-8e05-39b70f0ae363', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'ba035cbd-8acb-409f-b087-8619cb5b4ba4', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:11:18.189199+05:30', '2026-08-30 05:11:18.189199+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('5bfd4149-6d19-4932-894e-36afe2f8dd0a', '3b7fa967-1937-47b8-962f-274f8f4ff1b4', '974257bc-c420-4a42-91ae-b2bf6938b780', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-29 09:07:02.659633+05:30', '2026-08-29 09:07:02.659633+05:30', '16bc997f-7ada-4a5c-b5a6-3f837a06900f', '["NERT"]');
INSERT INTO public.authored_questions VALUES ('6c832b36-bcc8-492b-9302-0e2d831d606e', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'f7b0666d-0ad8-4370-93e1-66c172075228', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:09:01.346286+05:30', '2026-08-30 08:09:01.346286+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('876ae281-7f99-44b3-b9fd-94815152e468', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '50a628b6-715b-496c-ae24-24ee7bb5ca0b', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:09:07.980027+05:30', '2026-08-30 08:09:07.980027+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('fd4e5be1-3c9f-4cd0-bde3-789da9586dfc', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'f87fca27-38b0-4d2e-ab77-4ca2f7ddddc9', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:09:13.206179+05:30', '2026-08-30 08:09:13.206179+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('40ff370d-7d80-4721-870c-8fd19007dc1b', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '4da5f8b7-cc3a-4a7c-b607-bdfb5991c6fe', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:02.400671+05:30', '2026-08-30 05:13:02.400671+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('2652a837-1ed9-4281-ae9e-2fa7a09f5bf1', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '5b547ad6-b27f-4953-8447-39589478859b', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:24:43.219066+05:30', '2026-08-30 08:24:43.219066+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('02a3ae2a-fe4a-40a3-b74c-931a3b984d2c', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '032aba31-d647-402b-a5a4-91e9df3d9956', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:24:49.855986+05:30', '2026-08-30 08:24:49.855986+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('b043ad5e-4b5c-4a99-bc9c-90c2f1a8fcbd', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '4ee7dd1a-0053-4669-a197-49095119840b', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:24:55.154028+05:30', '2026-08-30 08:24:55.154028+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('ecc54982-48bb-4749-b2b6-6f4645080ecf', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '32e905e6-32c0-48e1-a1ea-2806ac5a0944', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:10.232147+05:30', '2026-08-30 05:13:10.232147+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('cefc546f-55e5-4aa8-bf4d-41ff7cc3fca0', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'd799b8ae-126a-4f03-9540-cc60a2aaecef', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:15.281865+05:30', '2026-08-30 05:13:15.281865+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('de04f76d-6891-4765-b157-463e607700db', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'e9298616-53c8-4492-a3d5-674828d09632', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:35.881542+05:30', '2026-08-30 05:13:35.881542+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('9afd8f8c-3e6a-4949-ade4-aa8e912b6632', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '09594270-30e7-4c9c-9b45-58f8d9813790', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:15:19.645895+05:30', '2026-08-30 05:15:19.645895+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('52ad6b2c-ee95-4488-b411-fe4f77af0534', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '234658e3-9652-46c7-bdde-16107d1456f3', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:15:54.87444+05:30', '2026-08-30 05:15:54.87444+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('b0c5a453-6a40-4400-8894-5a1759cb2718', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '1eb0bfb8-0c69-4683-91df-2e572c80158d', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:16:28.348615+05:30', '2026-08-30 05:16:28.348615+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('733424f8-a0ef-40a3-878b-ff9c9d5bc7a8', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '6d5c1cee-8724-468a-bf35-9f7bf196c66d', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:16:39.780243+05:30', '2026-08-30 05:16:39.780243+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('436fbd48-6187-41f6-8860-e17bba7bce07', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '56179dc5-b77a-492b-9829-fb7654a2e3ff', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:17:17.55056+05:30', '2026-08-30 05:17:17.55056+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('c1305133-e849-4e9a-9b1a-bd3f9b84c7bf', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'dbc6037d-93c1-445d-a30f-0fada64b8d50', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:17:22.620557+05:30', '2026-08-30 05:17:22.620557+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('4eaf49af-f32d-4be0-bbcc-42432b806802', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '1f9b5d1b-7d25-4254-8145-741a6caab935', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:21:54.309418+05:30', '2026-08-30 05:21:54.309418+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('fa4ca2e9-5135-4332-b52a-952effcdae39', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'd4ffd50f-d69b-42b6-bec7-3571fd888ff8', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:37:41.056583+05:30', '2026-08-30 08:37:41.056583+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('1ebe30c3-058e-48a9-9c74-965796f45c31', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'bfa74f19-db66-41d7-9bf0-a1c1c41bcba6', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:38:45.989226+05:30', '2026-08-30 08:38:45.989226+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('021f12a6-3723-47c9-80e7-ab5539f9cc2d', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '003b1c19-c3ee-452f-8a83-9df7519542bb', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:39:42.990073+05:30', '2026-08-30 08:39:42.990073+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('2327d712-dc43-4b34-a084-902a83121635', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'a6ac14fa-28d3-4006-bd13-5e4e6c74be77', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:39:49.593933+05:30', '2026-08-30 08:39:49.593933+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('c42ee619-c3aa-4e10-abe4-efd4d16c9c72', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '04f17b35-785f-4f84-b6d6-c974acab0809', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:39:54.746592+05:30', '2026-08-30 08:39:54.746592+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('0c53349c-8ff3-4d35-9ab4-8f96e669ea85', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '73c681f9-cea8-463c-8384-ecfccd740fe8', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:52:29.970633+05:30', '2026-08-30 08:52:29.970633+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('720e9dbc-5f7f-4d74-a957-e724ff669644', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'dee565c2-007a-43c8-bfec-b77e6b1eeed7', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:53:01.751847+05:30', '2026-08-30 08:53:01.751847+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('54f5451b-bf63-49a7-be81-e6b48b752195', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'f92d4d51-ffab-4d69-9058-7117a60a710c', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:17.754471+05:30', '2026-08-30 08:54:17.754471+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('8e9419f1-b29f-40c2-b569-ce01bd3c2754', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '256504c6-45eb-4c0b-9075-1fe11a950c37', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:24.599677+05:30', '2026-08-30 08:54:24.599677+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('df9f735e-0625-4485-8510-ba0755f6945b', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'b56cc7f6-aee2-4dec-ad84-d43aa4dfb376', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:29.695135+05:30', '2026-08-30 08:54:29.695135+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('e16f2152-46cc-46c0-bc6c-accdde61edc7', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '593953f7-3402-4319-9d65-585a4a72ce31', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:32.193508+05:30', '2026-08-30 08:54:32.193508+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('1414d9cf-cac9-4652-b196-7a9792646e65', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'a66a7ba9-6f92-4992-8b10-611e162fdf26', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 08:54:50.699678+05:30', '2026-08-30 08:54:50.699678+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('d6bcdd09-7954-412e-b251-51fdf4ce09c8', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '99c0c0a2-e157-46de-945b-f9ec1cd52614', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:15:54.366138+05:30', '2026-08-30 09:15:54.366138+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('de9db4aa-c353-4cb5-b76a-52ba4f2d12f1', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'cd962c25-f507-48e9-87fd-6da455ca0d74', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:15:59.545753+05:30', '2026-08-30 09:15:59.545753+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('36d19174-bf57-4bbb-bdf9-b7a9d3d5ef8f', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'a898e108-5872-420a-a2af-ff543953000b', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:16:02.093387+05:30', '2026-08-30 09:16:02.093387+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('a38a74ee-8618-4768-86b2-6966410ae5cf', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '1f3ad07f-c30b-4a5d-86ce-0243dbe22b21', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:16:28.596863+05:30', '2026-08-30 09:16:28.596863+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('9d781e9e-cc63-4fbf-b8ce-5a26cd035bf1', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '144dc9ea-62ad-4b93-a282-2d947b6029aa', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:16:44.24458+05:30', '2026-08-30 09:16:44.24458+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('167b0575-c3f2-4623-9e46-bbd13fd7cb23', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '52a7f609-035f-4c17-96e9-5bd65033a473', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:25:52.249908+05:30', '2026-08-30 09:25:52.249908+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('05b6eeb5-8479-4644-b196-df27074c17b7', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'c80366cd-d696-4f15-a7d5-69de97184310', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:26:23.68917+05:30', '2026-08-30 09:26:23.68917+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('58de6ee1-8b3d-4baa-b043-73f503dc7f74', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'f5af2208-3442-4524-ace5-dabf87b64b94', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:27:28.964688+05:30', '2026-08-30 09:27:28.964688+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('961c62e5-2326-464b-a97e-145c1382820a', '728c369b-303b-4f08-b3ee-19ab8cdcd703', '6cdc82d8-3e3c-4a6f-a6ca-8475af696baf', 'ARCHIVED', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-29 12:44:20.409504+05:30', '2026-08-29 17:18:00.431508+05:30', '173c07e0-52b4-4686-a3d0-ee0fa412cd8b', '[]');
INSERT INTO public.authored_questions VALUES ('3adfb229-4ade-42e2-929e-d0a4dbbbcfeb', '728c369b-303b-4f08-b3ee-19ab8cdcd703', '478dd2bf-0877-4e2a-886b-1297c12680dd', 'ARCHIVED', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-28 17:05:06.803619+05:30', '2026-08-29 17:24:18.447635+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('c752dc71-e24f-47bb-8401-8d466f6fcc16', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '200cb570-4793-465f-867a-b80853dba33b', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:28:34.114598+05:30', '2026-08-30 09:28:34.114598+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('deb3d75a-9c0b-43da-b7ff-659a4cec13e8', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '4bd6e7d7-5516-49d5-af06-5eae62d7459f', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:30:13.767472+05:30', '2026-08-30 09:30:13.767472+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('9a14d4ac-6075-4d20-bdde-eb73de68048e', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '5940f8a2-8f49-4114-94bb-5c7fa1832d63', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:30:47.185402+05:30', '2026-08-30 09:30:47.185402+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('1f1c701b-a7fd-4d87-85a4-daa0efb2c1ff', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '5b3d98d6-c405-427a-8611-fb8113a12db1', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:30:49.255506+05:30', '2026-08-30 09:30:49.255506+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('95f19a83-802a-4656-998a-b680e87bcad2', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '1557e73e-7b1c-49a5-99cb-cbad9b318e8d', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 09:31:12.556193+05:30', '2026-08-30 09:31:12.556193+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('b06a63b6-5977-438a-bc61-39c3bdda235b', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '8463576a-1d29-46df-a066-767420f90905', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:01:13.32806+05:30', '2026-08-30 10:01:13.32806+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('8ddf3142-bca1-4de3-a1e2-cb9e3e1da067', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '024d9a93-456d-4838-86af-1e0eb0d5491c', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:01:22.177429+05:30', '2026-08-30 10:01:22.177429+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('65a9c536-403e-4d8e-9b59-ae0865c1a3a2', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '19f00db7-2f32-4ae6-bd2f-c02f66b166ca', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:01:56.403144+05:30', '2026-08-30 10:01:56.403144+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('d80a9487-449b-44b4-9d07-62048fef1e3c', '728c369b-303b-4f08-b3ee-19ab8cdcd703', 'b3f5cdbc-2059-48c0-89d4-046e7255ee62', 'ARCHIVED', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-29 17:17:53.614748+05:30', '2026-08-29 22:02:23.353139+05:30', '173c07e0-52b4-4686-a3d0-ee0fa412cd8b', '[]');
INSERT INTO public.authored_questions VALUES ('fbe6aa5b-8b37-40d6-a9f9-3c35363e1834', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '0bb3fac9-aea1-4571-94ab-b743345a8094', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:02:33.464284+05:30', '2026-08-30 10:02:33.464284+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('39078667-719d-4be8-b9db-1e66831e5a4a', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'acf4214a-c800-4e7d-89c7-dbcb5a8cd6a9', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:04:40.716286+05:30', '2026-08-30 10:04:40.716286+05:30', NULL, '["E2E Fixture Paper"]');
INSERT INTO public.authored_questions VALUES ('66c164b9-42f0-492a-803f-9be83687aeb1', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'c8b975ae-b4f8-49cb-900e-a92f1f415d61', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:05:15.672197+05:30', '2026-08-30 10:05:15.672197+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('88906b03-b506-426c-9c04-4dfa4a1ed041', '3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', 'bc8e338a-0b14-4465-98b3-f083f8411173', 'DRAFT', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 10:06:20.708269+05:30', '2026-08-30 10:06:20.708269+05:30', NULL, '[]');
INSERT INTO public.authored_questions VALUES ('5521ec78-843c-4460-b7e1-29298c46d456', '728c369b-303b-4f08-b3ee-19ab8cdcd703', '9c9dc17b-64b8-494a-a1ae-ced5a8bac511', 'ARCHIVED', '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-09-10 21:05:57.854965+05:30', '2026-09-10 21:06:09.297803+05:30', NULL, '[]');


--
-- Data for Name: authored_test_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.authored_test_assignments VALUES ('5b02d236-d9ab-4bc1-9219-91db42318097', '4295271b-ec1d-4560-97db-1a054d61e06b', '0108adac-d24f-43c2-8828-b79c566c32ea', '2026-08-30 05:13:00+05:30', '2026-09-06 05:13:00+05:30', '2026-08-30 05:13:37.68618+05:30');
INSERT INTO public.authored_test_assignments VALUES ('6d1f618c-1abe-461f-814f-0fc0b9c77c56', 'a380cd89-b8f1-46d7-af14-b9b8ff8f5261', NULL, '2026-08-30 05:13:00+05:30', '2026-09-06 05:13:00+05:30', '2026-08-30 05:13:39.344291+05:30');
INSERT INTO public.authored_test_assignments VALUES ('d13862d5-2642-40f0-b377-1610d8aa9aa2', '79346a1b-ec69-4d59-becf-07e47e5e06cd', '0108adac-d24f-43c2-8828-b79c566c32ea', '2026-08-30 05:36:00+05:30', '2026-09-06 05:36:00+05:30', '2026-08-30 05:36:42.515559+05:30');
INSERT INTO public.authored_test_assignments VALUES ('8b69c448-cff3-43be-9487-85bdbea59d4b', '4e4aa07e-e99d-4530-8582-c2ac5dfe46c0', NULL, '2026-08-30 05:38:00+05:30', '2026-09-06 05:38:00+05:30', '2026-08-30 05:38:13.406065+05:30');


--
-- Data for Name: authored_test_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.authored_test_questions VALUES ('7785cf0b-bef3-4071-9510-008dacd28b7d', '4295271b-ec1d-4560-97db-1a054d61e06b', 'e9298616-53c8-4492-a3d5-674828d09632', 0, 1.00);
INSERT INTO public.authored_test_questions VALUES ('ab5e8a07-7a63-462e-8ee3-983435d0d9e0', 'a380cd89-b8f1-46d7-af14-b9b8ff8f5261', 'e9298616-53c8-4492-a3d5-674828d09632', 0, 1.00);
INSERT INTO public.authored_test_questions VALUES ('b0e8ff52-ab5b-4677-bfa5-e2364e74301a', '26ec3c94-5150-4b3c-bee3-83a33f4542f8', 'e9298616-53c8-4492-a3d5-674828d09632', 0, 1.00);
INSERT INTO public.authored_test_questions VALUES ('9dc75b0e-c1c1-458a-b094-dd7ad8155667', '79346a1b-ec69-4d59-becf-07e47e5e06cd', 'e9298616-53c8-4492-a3d5-674828d09632', 0, 1.00);
INSERT INTO public.authored_test_questions VALUES ('09e7c7f8-13c7-4159-9131-8e8668c63090', 'ceb35d83-22f5-4cb3-90d3-9925c450bade', 'e9298616-53c8-4492-a3d5-674828d09632', 0, 1.00);
INSERT INTO public.authored_test_questions VALUES ('ea2da07b-2d74-4c11-8b11-ef55b003d0fd', '4e4aa07e-e99d-4530-8582-c2ac5dfe46c0', 'e9298616-53c8-4492-a3d5-674828d09632', 0, 1.00);


--
-- Data for Name: authored_tests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.authored_tests VALUES ('4295271b-ec1d-4560-97db-1a054d61e06b', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'CreateTestE2E Chapter Mock Test', 60, 1.00, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:37.68618+05:30');
INSERT INTO public.authored_tests VALUES ('a380cd89-b8f1-46d7-af14-b9b8ff8f5261', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'CreateTestE2E Chapter Mock Test', 60, 1.00, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:13:39.344291+05:30');
INSERT INTO public.authored_tests VALUES ('26ec3c94-5150-4b3c-bee3-83a33f4542f8', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'CreateTestE2E Chapter Mock Test', 60, 1.00, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:15:07.996442+05:30');
INSERT INTO public.authored_tests VALUES ('79346a1b-ec69-4d59-becf-07e47e5e06cd', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'CreateTestE2E Chapter Mock Test', 60, 1.00, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:36:42.515559+05:30');
INSERT INTO public.authored_tests VALUES ('ceb35d83-22f5-4cb3-90d3-9925c450bade', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'CreateTestE2E Chapter Mock Test', 60, 1.00, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:37:17.070504+05:30');
INSERT INTO public.authored_tests VALUES ('4e4aa07e-e99d-4530-8582-c2ac5dfe46c0', '4d34074e-40e9-4f0d-8a7f-a3617519f99d', 'CreateTestE2E Chapter Mock Test', 60, 1.00, '4067a40f-8539-41f9-862c-571c6ce2960c', '2026-08-30 05:38:13.406065+05:30');


--
-- Data for Name: chapters; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.chapters VALUES ('3f452e27-a2cf-4ed8-8e3b-8895ee1ed2c0', '63e5642e-20b6-4089-bdc2-a7512d5a8493', 'RichEditorE2E Chapter', 1, '2026-08-30 05:10:30.077364+05:30');
INSERT INTO public.chapters VALUES ('4d34074e-40e9-4f0d-8a7f-a3617519f99d', '632d3188-45b9-446d-86a8-08be19e6eb4e', 'CreateTestE2E Chapter', 1, '2026-08-30 05:13:35.688056+05:30');
INSERT INTO public.chapters VALUES ('3ac8b215-4403-42f4-8a8a-8928092f0136', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Polynomials', 1, '2026-08-26 17:12:45.584627+05:30');
INSERT INTO public.chapters VALUES ('728c369b-303b-4f08-b3ee-19ab8cdcd703', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Real Numbers', 2, '2026-08-26 17:11:55.859062+05:30');
INSERT INTO public.chapters VALUES ('1595ab67-66b1-4d3e-b8d2-594466190d7d', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Trigonometry', 99, '2026-08-29 08:57:52.220979+05:30');
INSERT INTO public.chapters VALUES ('99abce2e-4ac3-469d-9f36-376086a11aeb', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Pair of Linear Equations', 3, '2026-08-26 17:13:05.036931+05:30');
INSERT INTO public.chapters VALUES ('70230b14-0a20-4359-93ce-92c5b0edf645', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Quadratic Equations', 4, '2026-08-26 17:13:27.613026+05:30');
INSERT INTO public.chapters VALUES ('528bcd38-578a-432c-ba75-a4c41a52c35e', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Arithmetic Progressions', 5, '2026-08-26 17:13:51.372475+05:30');
INSERT INTO public.chapters VALUES ('5dc28423-8aef-4f12-96df-dd982fa09401', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Triangles', 6, '2026-08-26 17:14:15.566481+05:30');
INSERT INTO public.chapters VALUES ('3b7fa967-1937-47b8-962f-274f8f4ff1b4', '3bceffeb-9732-4cf9-aea9-cbb2032d3c04', 'Coordinate Geometry', 7, '2026-08-26 17:14:38.255368+05:30');
INSERT INTO public.chapters VALUES ('b07ebc32-d255-495f-9fdd-3b2f547ee6d7', '3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5', 'Life Processes', 1, '2026-08-12 16:01:52.469987+05:30');
INSERT INTO public.chapters VALUES ('fff653c7-0029-45f2-897c-586de430efe7', '3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5', 'Acids, Bases and Salts', 2, '2026-08-12 08:49:44.463622+05:30');
INSERT INTO public.chapters VALUES ('166329af-e61b-492f-89a6-d379fdb3a052', '3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5', 'Light – Reflection and Refraction', 3, '2026-08-27 21:39:45.174332+05:30');
INSERT INTO public.chapters VALUES ('9cebf036-77a4-45ab-b956-3c9f21dd390b', '4ff645af-3445-4d92-ae4e-2dd48086f8d4', 'Resources and Development', 1, '2026-08-26 17:19:17.467185+05:30');
INSERT INTO public.chapters VALUES ('3512d9e8-9108-41ea-8ac2-2dac06f04ba6', '4ff645af-3445-4d92-ae4e-2dd48086f8d4', 'Development', 2, '2026-08-26 17:27:40.233658+05:30');


--
-- Data for Name: device_activations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.device_activations VALUES ('754546a5-6e4e-4976-8975-6c40a33994f7', 'e8057ceb-7647-4a2f-8218-0d2e0c6d3981', '370decb5-cefe-4865-b2d8-4a8777a9d029', '2026-08-12 08:57:09.439705+05:30');
INSERT INTO public.device_activations VALUES ('7d29a26b-4301-40b6-8b20-7945a5f69b03', '9130a83e-5221-4fb3-89aa-55ac791d11a2', 'smoke-check', '2026-08-12 19:46:12.921973+05:30');
INSERT INTO public.device_activations VALUES ('69c1eae0-654c-41e8-8d39-d0ee404b3847', '592f1c89-43f2-4042-b45e-ede76db9923b', 'demo-device-001', '2026-08-17 14:01:31.774222+05:30');
INSERT INTO public.device_activations VALUES ('367bcf98-65c4-4c81-bf57-f678f8a26ec2', '592f1c89-43f2-4042-b45e-ede76db9923b', 'demo-device-002', '2026-08-17 14:01:51.330298+05:30');
INSERT INTO public.device_activations VALUES ('05856389-0bfd-4601-a22d-cc895486dd15', '592f1c89-43f2-4042-b45e-ede76db9923b', 'demo-device-003', '2026-08-17 14:02:20.25188+05:30');
INSERT INTO public.device_activations VALUES ('9f6e1d05-3dde-4f02-bd3d-fd1441af1ca7', '592f1c89-43f2-4042-b45e-ede76db9923b', 'demo-device-004', '2026-08-17 14:02:45.302752+05:30');
INSERT INTO public.device_activations VALUES ('7c47f380-0b83-4099-90cd-f4773651b10b', '592f1c89-43f2-4042-b45e-ede76db9923b', 'demo-device-005', '2026-08-17 14:03:03.562134+05:30');
INSERT INTO public.device_activations VALUES ('4dd06c94-eea2-45b6-8cfb-90c36bcbf444', '592f1c89-43f2-4042-b45e-ede76db9923b', 'demo-device-006', '2026-08-17 14:03:18.700179+05:30');
INSERT INTO public.device_activations VALUES ('f2e0ad92-5640-4522-b021-05815e397450', '592f1c89-43f2-4042-b45e-ede76db9923b', 'de37d19c-750b-47ea-8cb7-da46f389fbef', '2026-08-17 14:12:31.79957+05:30');
INSERT INTO public.device_activations VALUES ('8dad4d89-8bc2-4d80-8337-3fc3d7e827d3', '38f40dd0-b846-486a-9d7a-c015ebe1aaf9', 'storefront-e2e', '2026-08-17 19:58:43.6137+05:30');
INSERT INTO public.device_activations VALUES ('7cceb89f-fdde-499e-9bc9-1adfbae99d6e', '533aa983-830d-4e73-92fd-6941da161305', 'test-browser-device-1', '2026-08-24 17:49:37.669718+05:30');
INSERT INTO public.device_activations VALUES ('8d5dc09a-b8e9-4a5e-8760-e173b501550d', '533aa983-830d-4e73-92fd-6941da161305', 'de37d19c-750b-47ea-8cb7-da46f389fbef', '2026-08-24 17:51:07.239207+05:30');
INSERT INTO public.device_activations VALUES ('0e7b1bed-5df5-43a4-877c-faf196c36cbc', 'd3f385bd-714c-4f50-82d6-ef0f4bc7b0e9', 'e2e-verify-device-001', '2026-08-27 21:54:14.842967+05:30');
INSERT INTO public.device_activations VALUES ('886b5b75-ca63-4888-8c91-80cb7172176a', 'd3f385bd-714c-4f50-82d6-ef0f4bc7b0e9', 'user-browser-test', '2026-08-27 21:59:58.804291+05:30');
INSERT INTO public.device_activations VALUES ('cfeade49-03b5-4b56-8fc9-195bff5c1231', 'd3f385bd-714c-4f50-82d6-ef0f4bc7b0e9', 'test-vite-proxy', '2026-08-27 22:01:53.960243+05:30');
INSERT INTO public.device_activations VALUES ('c271a842-7c03-4884-8453-151d3b3cb894', 'de33f86a-399e-41c3-bcfc-aebbb2c4c25d', 'test-fresh-device', '2026-08-27 22:02:11.379886+05:30');
INSERT INTO public.device_activations VALUES ('3314a2ef-8c91-4cd3-9983-c12baa00af14', 'de33f86a-399e-41c3-bcfc-aebbb2c4c25d', 'de37d19c-750b-47ea-8cb7-da46f389fbef', '2026-08-27 22:03:01.798626+05:30');
INSERT INTO public.device_activations VALUES ('a90ba256-4067-452e-a3e0-7d99907a3f8f', 'de33f86a-399e-41c3-bcfc-aebbb2c4c25d', 'test-tree-err', '2026-08-27 22:08:17.138287+05:30');
INSERT INTO public.device_activations VALUES ('f358c2e0-23a5-4cbe-8882-576a0bf727da', 'de33f86a-399e-41c3-bcfc-aebbb2c4c25d', 'test-check-english', '2026-08-27 22:15:22.938844+05:30');
INSERT INTO public.device_activations VALUES ('0529bfc1-d1e1-4ec2-b44f-7568c59d085c', 'de33f86a-399e-41c3-bcfc-aebbb2c4c25d', 'test-check-subjects', '2026-08-27 22:20:57.204575+05:30');
INSERT INTO public.device_activations VALUES ('171bf34e-40f1-430c-8885-6bd07831a750', '5cae7265-58f3-429b-9ae9-4c155b9dab55', 'de37d19c-750b-47ea-8cb7-da46f389fbef', '2026-08-28 13:17:12.910159+05:30');
INSERT INTO public.device_activations VALUES ('2b204844-4a40-4e12-9c85-644113e95ab7', '105ae07d-833c-47a4-8a77-f3b2c18e9fe4', '890d56fd-6b7b-4c21-aaed-3684d6dd5623', '2026-08-28 13:29:36.353692+05:30');
INSERT INTO public.device_activations VALUES ('9d7bc52a-8799-433a-9836-e3d9fd756e17', '105ae07d-833c-47a4-8a77-f3b2c18e9fe4', '522e7fcf-798f-496f-9aae-19d4e8d090d5', '2026-08-28 13:30:54.887028+05:30');
INSERT INTO public.device_activations VALUES ('74be9784-fa27-46b3-b7dd-deace1cd9770', '105ae07d-833c-47a4-8a77-f3b2c18e9fe4', 'dd7f564e-e807-4c38-82e5-127f9cedb5c6', '2026-08-28 14:18:35.840868+05:30');
INSERT INTO public.device_activations VALUES ('d6b0ad68-a653-4ebf-8f67-38ca090693c2', '105ae07d-833c-47a4-8a77-f3b2c18e9fe4', '9ee2a183-9b61-44bd-995f-3bd97fa6135c', '2026-08-28 14:20:20.870953+05:30');
INSERT INTO public.device_activations VALUES ('26044f97-4659-4584-9ed2-12517a918913', '105ae07d-833c-47a4-8a77-f3b2c18e9fe4', '2023d10a-f1e1-45eb-93d7-fb7705d18c25', '2026-08-28 14:21:11.153981+05:30');
INSERT INTO public.device_activations VALUES ('ac8290e6-ac28-41f0-9825-6d23bafbcbd0', 'f9982a6e-6ed5-469c-9ad1-aee5af67a127', 'c2a457a4-20d7-47a7-9edb-0b4168373dfd', '2026-08-28 14:22:55.87197+05:30');
INSERT INTO public.device_activations VALUES ('b6f75070-2807-47a0-bb55-fc88a297c2a9', '93130e9c-7dd7-4e2c-9a20-30eda3c723b6', 'vp-dev-1', '2026-08-28 17:35:39.595442+05:30');
INSERT INTO public.device_activations VALUES ('09d63a69-a73a-4a7a-859e-badbc0318516', '93130e9c-7dd7-4e2c-9a20-30eda3c723b6', 'vp-dev-2', '2026-08-28 17:35:42.289065+05:30');
INSERT INTO public.device_activations VALUES ('2a9eae18-a608-40b5-baa0-99289db46993', '2ad07bbe-fb86-4825-a589-75b69ae401ed', '1d35fcdd-ef7e-4303-b937-9badde0cc71d', '2026-08-29 08:09:40.061861+05:30');
INSERT INTO public.device_activations VALUES ('74f2616f-eb35-4efe-99df-572d68befd5f', '3c91590c-e1f4-435a-9f34-19609b0b7ed8', '2f2c0c29-9755-4c61-9dc1-890b481ce2a2', '2026-09-10 20:55:59.132234+05:30');
INSERT INTO public.device_activations VALUES ('a3efa9ea-24e2-423a-ae56-ea9f84a1e8ae', '10f3c0a6-2db9-46c8-b043-74dc5ecf3144', 'smoke-test-device-3', '2026-09-10 20:58:32.777018+05:30');
INSERT INTO public.device_activations VALUES ('17a8f25b-4ab6-4e52-80bc-b9383eb10476', 'e26067a9-21c6-4bf6-9d95-8849c590c087', 'smoke-test-device-5', '2026-09-10 20:58:49.055946+05:30');
INSERT INTO public.device_activations VALUES ('7c7a9979-9a1f-4fcb-8a1f-774f1d77751e', 'ef32d0df-2831-4f06-b61f-b059b84ebcce', 'smoke-test-device-6', '2026-09-10 20:58:56.480958+05:30');
INSERT INTO public.device_activations VALUES ('f360149b-2815-46dc-9756-b408450f24c5', '70febf24-2302-4d0f-b87a-86f23c59ef59', 'smoke-test-device-7', '2026-09-10 21:02:38.95818+05:30');
INSERT INTO public.device_activations VALUES ('1512776f-089f-428d-86c1-1f481ff39806', 'a81ae86d-785b-412d-a6e3-b5fa4d8a61de', 'fix-verify-1', '2026-09-10 21:05:26.118434+05:30');
INSERT INTO public.device_activations VALUES ('6588a685-23a1-419d-9715-a8bbdc36ffed', '757cc2fd-4f41-4395-95c0-1ac2d46009e6', 'fix-verify-2', '2026-09-10 21:05:40.574918+05:30');
INSERT INTO public.device_activations VALUES ('264bc643-35ba-43e2-ae8f-361da148368a', 'ecfb17e6-bb91-46a8-981d-18e754bb6315', 'dev-a-actest', '2026-09-10 21:07:09.112783+05:30');
INSERT INTO public.device_activations VALUES ('96bdf184-090a-4ed5-90e1-98f7c049971e', 'ecfb17e6-bb91-46a8-981d-18e754bb6315', 'dev-b-actest', '2026-09-10 21:07:09.52356+05:30');
INSERT INTO public.device_activations VALUES ('173e4f5d-d216-4fe9-b20a-315e5dfb9562', 'f7230295-76e4-464e-89aa-f2c719c56f56', 'final-verify', '2026-09-10 21:07:26.206809+05:30');
INSERT INTO public.device_activations VALUES ('93e2da1c-82ba-4e26-bd57-d1cb2375a294', '756c5925-8376-4dd4-b613-c70b80faf283', 'trig-test-1', '2026-09-11 07:29:35.469996+05:30');
INSERT INTO public.device_activations VALUES ('4434f4b0-bf31-473b-8cda-a5b1f18d1020', '4d7356ae-ef07-487b-90f8-9294123a2453', '17a1d71b-bc53-4683-9b66-b67eb831f2dd', '2026-09-11 07:41:07.18958+05:30');
INSERT INTO public.device_activations VALUES ('9cfb9875-291c-4df9-a8e8-b734e3ba4421', '49510500-d462-4b49-b257-3a12897a6031', '7de401de-6625-4df3-9aa3-dfe5fe211bb1', '2026-09-11 07:44:08.545601+05:30');
INSERT INTO public.device_activations VALUES ('29fd4cb3-7c08-4563-a028-cd09e1b3ede1', '72d9a49a-53b9-4588-be95-30f29fb350f4', '4b93a5e2-6659-475c-916d-e3a004f51bfa', '2026-09-11 07:45:21.158019+05:30');


--
-- Data for Name: lab_payloads; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lab_payloads VALUES ('d55fcf19-d65b-4cef-8b7f-d3b5cbd03f4b', 'VIRTUAL_LAB', 'Step through the dialysis circuit; drag to look around.', '', '{}', 'uploads/labs/d55fcf19-d65b-4cef-8b7f-d3b5cbd03f4b/hemodialysis-walkthrough.html');


--
-- Data for Name: mastery_events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.mastery_events VALUES ('9d34ab41-542e-471c-8370-b083ec2deaa1', 'e6f43ff2-b54c-4976-900a-1cf1412ed58b', 'mp_student_one', 'Student', 'chapter-05-arithmetic-progressions', 'AP-01', 'struggle', 'Confused the term''s position number with its value', '2026-08-28 11:14:39.989506+05:30');
INSERT INTO public.mastery_events VALUES ('52ce5760-d7c0-47bc-a6f8-0c5443c5578b', 'a51f6861-9f5b-41af-87e8-4cc271ca291c', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:07:55.692213+05:30');
INSERT INTO public.mastery_events VALUES ('89a6c211-7fbe-4ded-a414-227ea4aead07', 'dbbd1062-0a25-4d7c-a240-2fe4425fa463', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:43.751909+05:30');
INSERT INTO public.mastery_events VALUES ('a61b7ab0-cf34-44b6-9ece-3972b232f9e6', 'dbbd1062-0a25-4d7c-a240-2fe4425fa463', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:43.98557+05:30');
INSERT INTO public.mastery_events VALUES ('544f8bee-97df-4b9c-b21e-ed99b7192e4b', 'dbbd1062-0a25-4d7c-a240-2fe4425fa463', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:44.208245+05:30');
INSERT INTO public.mastery_events VALUES ('0dc760b7-ead7-4241-98f7-129bfdae05bd', 'dbbd1062-0a25-4d7c-a240-2fe4425fa463', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 09:50:44.4383+05:30');
INSERT INTO public.mastery_events VALUES ('14e4b845-2003-4329-a891-a654ea7aca4e', 'dbbd1062-0a25-4d7c-a240-2fe4425fa463', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 09:50:44.669051+05:30');
INSERT INTO public.mastery_events VALUES ('a133e2fe-8dc1-4dce-a441-863e3086a93b', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.172952+05:30');
INSERT INTO public.mastery_events VALUES ('e07dfd41-3c76-4132-be88-5b92bd65f654', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.204748+05:30');
INSERT INTO public.mastery_events VALUES ('5d17f947-0a76-4d22-8531-1980f1d37354', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.238655+05:30');
INSERT INTO public.mastery_events VALUES ('4a0275aa-b619-4b25-967f-751f1ff1ee32', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.268286+05:30');
INSERT INTO public.mastery_events VALUES ('98390745-fc27-4467-87c5-3c216aef7f4e', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.303314+05:30');
INSERT INTO public.mastery_events VALUES ('9f0b768e-3c68-43f4-bd4f-3da11835f4a6', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.334296+05:30');
INSERT INTO public.mastery_events VALUES ('654715e8-777c-41e2-87c8-89c0d2275fa7', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.363855+05:30');
INSERT INTO public.mastery_events VALUES ('1651c210-fd7b-414d-9173-c2311cc035bc', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:50:48.395485+05:30');
INSERT INTO public.mastery_events VALUES ('97247b51-9494-4a57-ac44-4e8ae6f9df17', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:50:48.427272+05:30');
INSERT INTO public.mastery_events VALUES ('ffb00a7a-877e-4efc-b445-51b50a4e43db', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:50:48.459511+05:30');
INSERT INTO public.mastery_events VALUES ('505dbc17-0670-4746-bda2-a572e7a8205b', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:50:48.488972+05:30');
INSERT INTO public.mastery_events VALUES ('3bab5b92-9a69-431f-aaa5-ed89faad2c6b', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:50:48.519966+05:30');
INSERT INTO public.mastery_events VALUES ('7d6e4649-2691-45bb-be08-15399064b41e', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:50:48.55186+05:30');
INSERT INTO public.mastery_events VALUES ('30b164fb-e7ba-4b3e-a0b8-cf39fbad7625', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:50:48.581355+05:30');
INSERT INTO public.mastery_events VALUES ('49c03c21-15ff-4f1e-b709-cf82b44f0c64', '9ceeec44-79fd-4b6b-ad34-9f8d56505e14', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:15:59.735738+05:30');
INSERT INTO public.mastery_events VALUES ('3b46aab4-b06c-448e-a2c4-f52f46eb08d1', 'bd789ee1-2434-48ac-be3f-a73c8c1533ce', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:10.592983+05:30');
INSERT INTO public.mastery_events VALUES ('2a4e7833-3024-479a-ac32-d67dc0bf3f03', 'bd789ee1-2434-48ac-be3f-a73c8c1533ce', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:10.824442+05:30');
INSERT INTO public.mastery_events VALUES ('61566492-a7ed-4406-aa9a-251155e48724', 'bd789ee1-2434-48ac-be3f-a73c8c1533ce', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:11.069803+05:30');
INSERT INTO public.mastery_events VALUES ('9c2326f4-133c-4dc3-8fdd-656e4560861f', 'bd789ee1-2434-48ac-be3f-a73c8c1533ce', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 09:52:11.307724+05:30');
INSERT INTO public.mastery_events VALUES ('6be3058c-b929-47cf-911b-f5aa5f6cb62c', 'bd789ee1-2434-48ac-be3f-a73c8c1533ce', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 09:52:11.55385+05:30');
INSERT INTO public.mastery_events VALUES ('45c88138-bc0a-4a32-85b8-ce51aa12efd7', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.381482+05:30');
INSERT INTO public.mastery_events VALUES ('982b4531-48e9-4bca-9b93-3aeb1ddf91d4', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.048258+05:30');
INSERT INTO public.mastery_events VALUES ('7b2616dd-77de-46ff-929d-b2ac28f1477f', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.083432+05:30');
INSERT INTO public.mastery_events VALUES ('bf01fd5a-2e4e-4191-8161-142467c12b54', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.117757+05:30');
INSERT INTO public.mastery_events VALUES ('3211a24a-090a-4c97-b1f4-69150742a869', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.14918+05:30');
INSERT INTO public.mastery_events VALUES ('7891f77c-531d-4f1c-9d31-a2a200bf42f4', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.181232+05:30');
INSERT INTO public.mastery_events VALUES ('b1862233-7378-423d-89fe-c8b38adfdfe3', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.214685+05:30');
INSERT INTO public.mastery_events VALUES ('02ba0615-426b-4543-9400-68db9390d8a9', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.246755+05:30');
INSERT INTO public.mastery_events VALUES ('cad8a844-93ad-4388-8cc7-047f18d022bf', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:52:22.278862+05:30');
INSERT INTO public.mastery_events VALUES ('f987783d-3c97-4088-8fee-e2527704beec', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:52:22.316529+05:30');
INSERT INTO public.mastery_events VALUES ('9c6805e6-9cee-4cda-80be-538e6a504807', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:52:22.349693+05:30');
INSERT INTO public.mastery_events VALUES ('970f16d5-4b58-4662-8501-5de2f77474d7', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:52:22.384639+05:30');
INSERT INTO public.mastery_events VALUES ('5e91c5d9-9679-4a17-9d81-0d633091bf97', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:52:22.415716+05:30');
INSERT INTO public.mastery_events VALUES ('90ed5f75-e8b1-44ec-a001-d2da241ca9ee', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:52:22.447711+05:30');
INSERT INTO public.mastery_events VALUES ('a220a098-1148-479b-a415-89821f3f4fd6', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:52:22.479458+05:30');
INSERT INTO public.mastery_events VALUES ('3fbb1057-d2f2-4980-b1f9-f06b50f3fbbc', '954aeb93-6daf-48c2-a024-7b6e01670173', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:14.946996+05:30');
INSERT INTO public.mastery_events VALUES ('eae76e7f-7f5f-41df-88b4-bfdef2a6262e', '954aeb93-6daf-48c2-a024-7b6e01670173', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:15.362001+05:30');
INSERT INTO public.mastery_events VALUES ('d8833be9-819f-4c1f-8270-aaf769b2d467', '954aeb93-6daf-48c2-a024-7b6e01670173', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:15.742612+05:30');
INSERT INTO public.mastery_events VALUES ('7606e73e-2c8b-4ea4-b18b-53ab47bab420', '954aeb93-6daf-48c2-a024-7b6e01670173', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 09:58:16.099615+05:30');
INSERT INTO public.mastery_events VALUES ('b880c162-7092-4139-be69-343b1642c20e', '954aeb93-6daf-48c2-a024-7b6e01670173', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 09:58:16.52209+05:30');
INSERT INTO public.mastery_events VALUES ('7eaabef9-c99f-4e8a-89e0-724d161fbb0e', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.290211+05:30');
INSERT INTO public.mastery_events VALUES ('c1106c35-a16e-49b0-a1b0-9c01b3704f5f', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.322404+05:30');
INSERT INTO public.mastery_events VALUES ('1df945e8-e76d-4d13-98ef-350f2cc0ccf3', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.472472+05:30');
INSERT INTO public.mastery_events VALUES ('8d67fbb3-6d1d-43e0-bef2-059f6a163d37', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.502368+05:30');
INSERT INTO public.mastery_events VALUES ('2fdbcfef-c417-46a2-9a7c-9f3b752fad1d', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.538533+05:30');
INSERT INTO public.mastery_events VALUES ('87a65677-ce84-4006-bb8d-240b41caa469', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.573437+05:30');
INSERT INTO public.mastery_events VALUES ('bec0cc21-c084-4d3f-8707-3a741a6465d2', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.627025+05:30');
INSERT INTO public.mastery_events VALUES ('ec4861e6-3bd5-415d-a09f-d73c1e414b83', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 09:58:33.67275+05:30');
INSERT INTO public.mastery_events VALUES ('f3157e8c-8466-44d4-9cfc-3a85a31ac78b', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:58:33.726886+05:30');
INSERT INTO public.mastery_events VALUES ('997ae166-ba7f-45e1-9961-251e3af81756', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:58:33.768938+05:30');
INSERT INTO public.mastery_events VALUES ('cbd5fe31-ada6-4386-bb2e-174434b3b926', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:58:33.808585+05:30');
INSERT INTO public.mastery_events VALUES ('395742da-7913-485c-8396-bc1e6a7720af', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:58:33.846438+05:30');
INSERT INTO public.mastery_events VALUES ('96e10584-0076-4570-8557-e34481308577', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:58:33.887491+05:30');
INSERT INTO public.mastery_events VALUES ('cbaf3649-4de7-4810-a732-32a20e4feb17', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 09:58:33.929817+05:30');
INSERT INTO public.mastery_events VALUES ('0ca077e5-b7b7-4960-abd0-e3fa78142102', 'e6f43ff2-b54c-4976-900a-1cf1412ed58b', 'mp_student_two', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted a1 - a2 instead of a2 - a1, got the sign of d backwards', '2026-08-28 11:14:42.907225+05:30');
INSERT INTO public.mastery_events VALUES ('89a6535b-606a-496d-a49b-d602aa25b961', '9ceeec44-79fd-4b6b-ad34-9f8d56505e14', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:16:00.18517+05:30');
INSERT INTO public.mastery_events VALUES ('842c1bef-e845-4623-b782-d45f1ae0b0e2', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.442923+05:30');
INSERT INTO public.mastery_events VALUES ('d578cd41-81aa-4afe-962c-f2093d5b9cb9', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.641572+05:30');
INSERT INTO public.mastery_events VALUES ('abe7dce4-aabe-478f-8187-e413334fd09b', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:17:15.832739+05:30');
INSERT INTO public.mastery_events VALUES ('e4ee598a-54c3-47c6-b98f-c5ec5dbf633e', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:17:16.050654+05:30');
INSERT INTO public.mastery_events VALUES ('aaa9842b-14b1-4ae2-a01f-62e69509985c', '300fcd8f-74e2-4efa-adb9-45fc38397962', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:38:39.384156+05:30');
INSERT INTO public.mastery_events VALUES ('23203be4-4266-44b1-b899-91c1c6c3daa1', '300fcd8f-74e2-4efa-adb9-45fc38397962', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:38:41.981056+05:30');
INSERT INTO public.mastery_events VALUES ('5f28864b-3cb3-442e-b7e3-508c15c295a7', '138c8b90-8d11-4812-b2c2-364a3b753d32', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:08.941211+05:30');
INSERT INTO public.mastery_events VALUES ('3801a82d-dc69-4cf2-b5bf-c7a9dee6a9a8', '138c8b90-8d11-4812-b2c2-364a3b753d32', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:09.195115+05:30');
INSERT INTO public.mastery_events VALUES ('346197d8-e74c-439c-981a-a1fa9d328970', '138c8b90-8d11-4812-b2c2-364a3b753d32', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:09.417522+05:30');
INSERT INTO public.mastery_events VALUES ('bb18f3e3-5414-4e68-bc0b-df7785f76207', '138c8b90-8d11-4812-b2c2-364a3b753d32', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 10:29:09.757312+05:30');
INSERT INTO public.mastery_events VALUES ('bc5cd901-6938-491d-a491-589e101ffbdc', '138c8b90-8d11-4812-b2c2-364a3b753d32', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 10:29:10.000097+05:30');
INSERT INTO public.mastery_events VALUES ('956c56be-407d-42d5-b8e5-896aca04e0c8', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.553598+05:30');
INSERT INTO public.mastery_events VALUES ('505c575a-eca5-4768-8e95-a1a5df539140', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.793465+05:30');
INSERT INTO public.mastery_events VALUES ('bbdb3795-8e45-4f0e-82c5-cd2cb9736fca', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:37.031305+05:30');
INSERT INTO public.mastery_events VALUES ('061e7b82-f704-4746-9546-172333662d59', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:40:37.270077+05:30');
INSERT INTO public.mastery_events VALUES ('259ddf73-4649-48e3-a05e-de6c8b0e2314', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:40:37.500997+05:30');
INSERT INTO public.mastery_events VALUES ('3f84b79d-372b-4dfc-9b76-4bd1c3bab311', '42781425-f925-4641-b184-0ca7055520c9', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:44:07.238392+05:30');
INSERT INTO public.mastery_events VALUES ('3721a6b6-a1a7-433f-afcd-13e47e1a8914', '42781425-f925-4641-b184-0ca7055520c9', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:44:08.105271+05:30');
INSERT INTO public.mastery_events VALUES ('79c7183d-97e0-4cc5-951e-460184150c0e', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.311104+05:30');
INSERT INTO public.mastery_events VALUES ('d1db3d4f-be6e-4cbc-80e6-44b90a66d6c8', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.43193+05:30');
INSERT INTO public.mastery_events VALUES ('6567282d-9a27-491b-aad3-30b0d0a67feb', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.549591+05:30');
INSERT INTO public.mastery_events VALUES ('8e3004b9-06b3-4329-ab2a-f0310753a6ad', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.794608+05:30');
INSERT INTO public.mastery_events VALUES ('71258433-fed5-4d79-8607-a7827f5f06ab', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:45:09.951687+05:30');
INSERT INTO public.mastery_events VALUES ('74788935-a1b2-4b3c-902c-9492765c387a', 'ffe48f61-054d-4c8f-a46d-7bc49edfa510', 'sc_student_1', 'Student', 'test-trig-chapter', 'T-01', 'mastery', NULL, '2026-08-28 12:00:24.65823+05:30');
INSERT INTO public.mastery_events VALUES ('25fca773-ed0e-43d5-95b0-06c1fceb7d77', 'ffe48f61-054d-4c8f-a46d-7bc49edfa510', 'sc_student_1', 'Student', 'test-trig-chapter', 'T-02', 'mastery', NULL, '2026-08-28 12:00:24.736996+05:30');
INSERT INTO public.mastery_events VALUES ('f4947d25-f7a4-4095-9861-9d4f00c6c4d3', 'ffe48f61-054d-4c8f-a46d-7bc49edfa510', 'sc_student_1', 'Student', 'test-optics-chapter', 'O-01', 'mastery', NULL, '2026-08-28 12:00:24.818075+05:30');
INSERT INTO public.mastery_events VALUES ('ec52a687-e31e-441b-8ca4-4477adf2f0c6', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:16.53938+05:30');
INSERT INTO public.mastery_events VALUES ('2368c8bb-348d-4150-b0ca-5e46eba97b3f', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:16.615645+05:30');
INSERT INTO public.mastery_events VALUES ('7d666a33-5cc2-4b17-9688-6e49fafbc8bb', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:16.694169+05:30');
INSERT INTO public.mastery_events VALUES ('543aca14-19f2-49cb-9b64-1061cd7ad58a', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:16.774064+05:30');
INSERT INTO public.mastery_events VALUES ('d6e13f9a-71db-4da7-9b54-b7d5a16d0b39', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:16.847937+05:30');
INSERT INTO public.mastery_events VALUES ('b120bb60-238b-4ec7-9d95-5f740bbc7081', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:16.923754+05:30');
INSERT INTO public.mastery_events VALUES ('a7beca51-ceb4-454f-bc0f-33212b760b1c', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:17.005048+05:30');
INSERT INTO public.mastery_events VALUES ('b2b6b15b-166f-41df-94f1-c259c0c4614a', 'e6f43ff2-b54c-4976-900a-1cf1412ed58b', 'mp_student_two', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Moved terms across the equals sign with the wrong sign, same backwards-subtraction habit as the common difference mistake', '2026-08-28 11:14:43.58418+05:30');
INSERT INTO public.mastery_events VALUES ('479ac4c1-086c-4012-bd02-e90e92eeeb9c', '9ceeec44-79fd-4b6b-ad34-9f8d56505e14', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:15:58.858612+05:30');
INSERT INTO public.mastery_events VALUES ('d1bf0268-3352-4c44-a993-c92d3100e537', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.20611+05:30');
INSERT INTO public.mastery_events VALUES ('9e5bf3f2-9619-4a89-805e-509dbbbda83e', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.240948+05:30');
INSERT INTO public.mastery_events VALUES ('eff6f2df-98fd-4f85-bff7-0481307a51a9', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.277941+05:30');
INSERT INTO public.mastery_events VALUES ('d9b9b6c9-1839-40ae-82d0-e8da7ae5e9e5', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.312794+05:30');
INSERT INTO public.mastery_events VALUES ('37b2e4e4-7855-4872-8f72-cbd4d2bca9fc', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.345608+05:30');
INSERT INTO public.mastery_events VALUES ('647d3846-a267-4006-b462-f901a4de9e1e', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.379893+05:30');
INSERT INTO public.mastery_events VALUES ('8c0449e0-6839-4f09-8523-eb3df9cbea34', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.411468+05:30');
INSERT INTO public.mastery_events VALUES ('c402ca16-c65a-438d-8474-b758ebcaaa9d', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:29:31.44947+05:30');
INSERT INTO public.mastery_events VALUES ('2f89094e-cc7b-49ec-b82d-5d229a8ffc01', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:29:31.481389+05:30');
INSERT INTO public.mastery_events VALUES ('2a5e4ea4-1c32-421a-881e-01d8a48f6ce3', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:29:31.517479+05:30');
INSERT INTO public.mastery_events VALUES ('2b828b10-019d-446c-a983-db37511c3a02', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:29:31.552333+05:30');
INSERT INTO public.mastery_events VALUES ('d7112b5e-51aa-4190-8998-e75003c10e3a', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:29:31.587543+05:30');
INSERT INTO public.mastery_events VALUES ('b5b713d1-237a-49f7-803b-577e094bdcb2', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:29:31.624059+05:30');
INSERT INTO public.mastery_events VALUES ('b261704f-aeca-4764-b2c7-a9aba67b2ccf', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:29:31.658815+05:30');
INSERT INTO public.mastery_events VALUES ('4365c02e-77ef-4309-aa3e-12238958b601', 'a7bdd85f-35a8-48dd-8c9e-7e0a4f666b5f', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:41:47.977243+05:30');
INSERT INTO public.mastery_events VALUES ('742ea8a4-4818-4a79-8528-badeb73ca270', 'a7bdd85f-35a8-48dd-8c9e-7e0a4f666b5f', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:41:48.34046+05:30');
INSERT INTO public.mastery_events VALUES ('28ed663d-a4b0-4946-820c-f8ba4f79f5a4', 'a7bdd85f-35a8-48dd-8c9e-7e0a4f666b5f', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:41:48.696169+05:30');
INSERT INTO public.mastery_events VALUES ('c57499db-73f6-490b-ae54-6076e7c1f911', 'a7bdd85f-35a8-48dd-8c9e-7e0a4f666b5f', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 10:41:49.052422+05:30');
INSERT INTO public.mastery_events VALUES ('e1218fb4-5b02-46e4-9fb0-c9974a6371e7', 'a7bdd85f-35a8-48dd-8c9e-7e0a4f666b5f', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 10:41:49.391198+05:30');
INSERT INTO public.mastery_events VALUES ('169236f3-fece-4eb6-8101-7d4d41d8e81c', '9ceeec44-79fd-4b6b-ad34-9f8d56505e14', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:16:00.727063+05:30');
INSERT INTO public.mastery_events VALUES ('0e06c16e-e77c-4c8d-8b8b-0a25d21166a9', 'a51f6861-9f5b-41af-87e8-4cc271ca291c', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:07:56.632908+05:30');
INSERT INTO public.mastery_events VALUES ('03ae3feb-3914-42ab-b919-0fc2699d022e', 'a51f6861-9f5b-41af-87e8-4cc271ca291c', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-02', 'struggle', 'stuck on AP-02', '2026-08-28 12:08:00.140914+05:30');
INSERT INTO public.mastery_events VALUES ('05e448ff-0e4d-4296-afec-f2116133bfd4', '4836f463-00ea-416f-bfd3-0a2ca8103f3f', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'stuck on AP-11', '2026-08-28 12:08:30.852922+05:30');
INSERT INTO public.mastery_events VALUES ('0331aaca-8e23-4840-a8cb-cc60b6f605f3', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.208328+05:30');
INSERT INTO public.mastery_events VALUES ('28c322ee-8577-4e5a-940b-b3d01dcde62c', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.252728+05:30');
INSERT INTO public.mastery_events VALUES ('d3d3cf78-b04f-4d11-87c5-ddbac8e1b49a', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.512407+05:30');
INSERT INTO public.mastery_events VALUES ('c7910d16-0bf3-4fad-8dee-19cb51df8ea9', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.704795+05:30');
INSERT INTO public.mastery_events VALUES ('d0d50a36-1df9-4521-8d76-5de50a3dd87c', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:17:15.90189+05:30');
INSERT INTO public.mastery_events VALUES ('09edcf08-b7cb-4b68-8418-998a5afb447e', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:17:16.111477+05:30');
INSERT INTO public.mastery_events VALUES ('c359493e-51bc-4e16-87b3-fd7118d78298', '300fcd8f-74e2-4efa-adb9-45fc38397962', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:38:40.246916+05:30');
INSERT INTO public.mastery_events VALUES ('b33ba26e-4fe8-44a6-aa72-355f1c11c2fd', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.371002+05:30');
INSERT INTO public.mastery_events VALUES ('568705c0-307d-4664-8698-65a511f0f519', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.391881+05:30');
INSERT INTO public.mastery_events VALUES ('afe92445-1bf2-4270-ab70-fcd46d2ed520', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.428665+05:30');
INSERT INTO public.mastery_events VALUES ('e113c6f1-ff0f-4017-b3a4-f3d8d49b4db6', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.466182+05:30');
INSERT INTO public.mastery_events VALUES ('9633f45f-7fbe-418f-90c8-ee51258c167b', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.500439+05:30');
INSERT INTO public.mastery_events VALUES ('987b7fe4-0da8-413a-8585-b4d315ad885f', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.536237+05:30');
INSERT INTO public.mastery_events VALUES ('b33a78f3-c2ea-4fca-aad9-be6ec2c0fc5b', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.573432+05:30');
INSERT INTO public.mastery_events VALUES ('40167384-495c-42ff-b817-bc5938fcd788', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.6105+05:30');
INSERT INTO public.mastery_events VALUES ('53feaa76-96d4-4f7f-ae8b-bfaed2385064', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 10:42:24.652071+05:30');
INSERT INTO public.mastery_events VALUES ('4d0ddb91-bad6-4fe2-af97-896b99e4efcd', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:42:24.697552+05:30');
INSERT INTO public.mastery_events VALUES ('023d63bd-691d-43d9-a884-a10b612f5b84', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:42:24.739238+05:30');
INSERT INTO public.mastery_events VALUES ('d18bb595-011b-4a2d-a638-68bf90fe36d1', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:42:24.780725+05:30');
INSERT INTO public.mastery_events VALUES ('a5fe83b9-4c4a-412f-8bd9-e3b4eaa05d52', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.63388+05:30');
INSERT INTO public.mastery_events VALUES ('ac867793-c430-4ef7-91af-b6e8b1775b9b', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.873549+05:30');
INSERT INTO public.mastery_events VALUES ('e29439d9-d65d-44cd-8a82-07f686c9adb1', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:40:37.107199+05:30');
INSERT INTO public.mastery_events VALUES ('624fc061-a4dd-4ffd-a708-a811271ff19f', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:40:37.344818+05:30');
INSERT INTO public.mastery_events VALUES ('07831d73-cd8e-4a62-90dd-968ff557d00a', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:42:24.820195+05:30');
INSERT INTO public.mastery_events VALUES ('9b76c076-1ea2-4800-8999-4500919f2aee', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:42:24.856637+05:30');
INSERT INTO public.mastery_events VALUES ('7e678efc-119a-44b5-996c-e0f7f2ee2024', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 10:42:24.896432+05:30');
INSERT INTO public.mastery_events VALUES ('49b224d8-aaec-46c1-90f8-8d9477ef4add', 'a51f6861-9f5b-41af-87e8-4cc271ca291c', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:07:57.508084+05:30');
INSERT INTO public.mastery_events VALUES ('a88661f2-4111-4dc8-8bc9-7b9b30ab085d', '9ceeec44-79fd-4b6b-ad34-9f8d56505e14', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:15:59.296494+05:30');
INSERT INTO public.mastery_events VALUES ('15f67c8f-37bc-43c8-b8b7-e86713d709d3', '4836f463-00ea-416f-bfd3-0a2ca8103f3f', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:08:28.325978+05:30');
INSERT INTO public.mastery_events VALUES ('25f9012e-aba5-4577-8f5e-3f56585cc994', '4836f463-00ea-416f-bfd3-0a2ca8103f3f', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'stuck on AP-11', '2026-08-28 12:08:31.721118+05:30');
INSERT INTO public.mastery_events VALUES ('936822e1-2332-41ff-8f8c-6c1708ec4969', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.244804+05:30');
INSERT INTO public.mastery_events VALUES ('0a7b29d2-ac91-442f-b91c-7c2db009a98b', '6494db3f-62e5-4ae0-8dec-8dd3ca296561', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:10:57.521103+05:30');
INSERT INTO public.mastery_events VALUES ('ba318929-892c-4513-a9d5-5f719795e4a6', '6494db3f-62e5-4ae0-8dec-8dd3ca296561', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 12:11:00.056436+05:30');
INSERT INTO public.mastery_events VALUES ('7d1429d8-793e-4d5d-9672-120b8352175b', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.318435+05:30');
INSERT INTO public.mastery_events VALUES ('1ebd7db8-ccc4-41b2-98c1-b8b3b8140804', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:17:15.581493+05:30');
INSERT INTO public.mastery_events VALUES ('019435a6-efe8-4d5f-b4ee-801b2ddaaf06', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:17:15.766803+05:30');
INSERT INTO public.mastery_events VALUES ('1761184e-c791-426e-85b3-9bd72816ef6b', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:17:15.983359+05:30');
INSERT INTO public.mastery_events VALUES ('1a75bbef-7ef1-4966-96cf-4df7e5c7483c', '300fcd8f-74e2-4efa-adb9-45fc38397962', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:38:38.517444+05:30');
INSERT INTO public.mastery_events VALUES ('66692f9e-71d2-4ddc-b996-a1244febedbb', '300fcd8f-74e2-4efa-adb9-45fc38397962', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:38:41.120712+05:30');
INSERT INTO public.mastery_events VALUES ('04a38d6f-7e9d-464e-954a-eb87a80a9b8c', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.404708+05:30');
INSERT INTO public.mastery_events VALUES ('758f3c5c-bdc3-44b3-aabb-97bdbbd1a7b0', '07385456-e20c-4a5c-a930-53abd0dec865', 'sc_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:12:14.418453+05:30');
INSERT INTO public.mastery_events VALUES ('075ef97b-059d-4825-af39-dc0669da88d0', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.475102+05:30');
INSERT INTO public.mastery_events VALUES ('d8509480-a493-4d63-aa00-3f6e77ab418d', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.715035+05:30');
INSERT INTO public.mastery_events VALUES ('2266f2a2-bb41-4317-9dc9-a8286e687b01', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:40:36.952689+05:30');
INSERT INTO public.mastery_events VALUES ('b5b05a7b-586d-4041-8e72-ac673188176a', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:40:37.186858+05:30');
INSERT INTO public.mastery_events VALUES ('1337242b-0dd5-4c00-b407-2594f895ab4e', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:40:37.421542+05:30');
INSERT INTO public.mastery_events VALUES ('ed5bc7de-8986-4b12-a419-7080bdafb1a4', '42781425-f925-4641-b184-0ca7055520c9', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:44:06.802655+05:30');
INSERT INTO public.mastery_events VALUES ('21eec72c-d8fe-48f0-8d32-447f5962840a', '42781425-f925-4641-b184-0ca7055520c9', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:44:07.667595+05:30');
INSERT INTO public.mastery_events VALUES ('5a9d6c0c-32e8-473d-a3da-ed8368e2c606', '42781425-f925-4641-b184-0ca7055520c9', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:44:08.529579+05:30');
INSERT INTO public.mastery_events VALUES ('f6ed77a5-9569-4bc3-ba25-51f9f30e84b1', '07385456-e20c-4a5c-a930-53abd0dec865', 'sc_student_1', 'Student', 'test-optics-chapter', 'O-01', 'mastery', NULL, '2026-08-28 12:12:14.667715+05:30');
INSERT INTO public.mastery_events VALUES ('94ee9ed4-5e9c-4276-9d8f-28c584593688', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.086506+05:30');
INSERT INTO public.mastery_events VALUES ('a0ff7aff-43f0-4147-a691-85e21ecfb6ad', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.33024+05:30');
INSERT INTO public.mastery_events VALUES ('1222da3f-5174-4300-8551-1557b6f6ef24', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.569676+05:30');
INSERT INTO public.mastery_events VALUES ('b83ae3fa-3a15-408a-a426-6d61f0f91706', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:13:09.79942+05:30');
INSERT INTO public.mastery_events VALUES ('8979c316-d405-4a0d-ada1-567a458a0cb7', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:13:10.018346+05:30');
INSERT INTO public.mastery_events VALUES ('66de21b6-2ca3-4fcd-9bfd-508727658b78', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.372297+05:30');
INSERT INTO public.mastery_events VALUES ('3bd4fdd3-3f08-4086-a034-16cd5ad5b960', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.490841+05:30');
INSERT INTO public.mastery_events VALUES ('ce8da336-a159-4154-9656-c92a6e6a1eff', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.718956+05:30');
INSERT INTO public.mastery_events VALUES ('895ddebb-286b-4006-a60d-ce1f4ffde04b', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:45:09.865929+05:30');
INSERT INTO public.mastery_events VALUES ('8e797dd9-dfab-4121-883d-1047c7b91db8', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:45:10.010575+05:30');
INSERT INTO public.mastery_events VALUES ('f775247e-b883-4bde-9f5e-c24c67901892', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:45:10.068121+05:30');
INSERT INTO public.mastery_events VALUES ('8e1bca28-9d53-451b-ae9b-2395a40cf081', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:45:10.122636+05:30');
INSERT INTO public.mastery_events VALUES ('dfa6b044-202b-4db6-91d5-d2393c94f263', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:45:10.183045+05:30');
INSERT INTO public.mastery_events VALUES ('5fa85c06-f33d-4c6f-82d2-c0cf92a8239c', '3d1c34e2-f0aa-488c-8d62-0dbaee97b43a', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:55:06.962331+05:30');
INSERT INTO public.mastery_events VALUES ('9577ebb7-649e-4ee3-8616-e7ed7566e389', '3d1c34e2-f0aa-488c-8d62-0dbaee97b43a', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 12:55:09.647625+05:30');
INSERT INTO public.mastery_events VALUES ('449f1564-1195-4f92-8077-91a6f994b940', 'f419f3f7-4cac-4f7b-9f51-98832d73dba2', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:56:11.763296+05:30');
INSERT INTO public.mastery_events VALUES ('b2aff2a3-f5f4-4d74-9f68-0df50201e68e', 'f419f3f7-4cac-4f7b-9f51-98832d73dba2', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'stuck on AP-11', '2026-08-28 12:56:14.234476+05:30');
INSERT INTO public.mastery_events VALUES ('55b8035c-7a44-488f-9d07-8faa2636b52d', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:48.705376+05:30');
INSERT INTO public.mastery_events VALUES ('df583f90-acbe-4807-a70b-bd7f960989d8', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:48.949553+05:30');
INSERT INTO public.mastery_events VALUES ('8539bdf7-cf64-4a87-83af-d32e24de31e9', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:57:49.182411+05:30');
INSERT INTO public.mastery_events VALUES ('0d6ba8d8-9ade-4ef2-8d29-9c1e9367e5b0', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 11:45:10.240524+05:30');
INSERT INTO public.mastery_events VALUES ('4b752f07-b768-4229-acfe-743ce8d2b2c2', 'a51f6861-9f5b-41af-87e8-4cc271ca291c', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'stuck on AP-11', '2026-08-28 12:07:58.43378+05:30');
INSERT INTO public.mastery_events VALUES ('10fb1dbf-dc46-4ed8-92ab-247b315ea743', '4836f463-00ea-416f-bfd3-0a2ca8103f3f', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:08:29.168924+05:30');
INSERT INTO public.mastery_events VALUES ('f121ab85-243e-4f2d-a369-d3ea07a1b349', '306d7bfb-c0fa-440e-bbae-75637db2723a', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:59:10.288927+05:30');
INSERT INTO public.mastery_events VALUES ('5b41c3cb-29cf-4162-8599-cd7f10df8d7b', '306d7bfb-c0fa-440e-bbae-75637db2723a', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:59:11.133645+05:30');
INSERT INTO public.mastery_events VALUES ('0707cfb3-7c90-4064-a5f8-cacc97d73bbc', '306d7bfb-c0fa-440e-bbae-75637db2723a', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 11:59:11.988825+05:30');
INSERT INTO public.mastery_events VALUES ('2574fba2-1a6e-4514-b5ab-b5aa65b3034b', '306d7bfb-c0fa-440e-bbae-75637db2723a', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:59:12.937438+05:30');
INSERT INTO public.mastery_events VALUES ('ec33fcef-caad-4a8c-99ab-d0ef0ecb4404', '306d7bfb-c0fa-440e-bbae-75637db2723a', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 11:59:13.824771+05:30');
INSERT INTO public.mastery_events VALUES ('d5d15fda-cd89-4702-8b6c-b36aca7d8d8b', '4836f463-00ea-416f-bfd3-0a2ca8103f3f', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-02', 'struggle', 'stuck on AP-02', '2026-08-28 12:08:32.603198+05:30');
INSERT INTO public.mastery_events VALUES ('83fe4d8a-aa83-47b6-87fd-5b6203a9228d', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.275034+05:30');
INSERT INTO public.mastery_events VALUES ('730a7375-ce8c-42aa-a1c6-4e3cf4fc839b', '6494db3f-62e5-4ae0-8dec-8dd3ca296561', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:10:58.431943+05:30');
INSERT INTO public.mastery_events VALUES ('980263cd-ce9a-40e3-8c7a-018740c37161', '6494db3f-62e5-4ae0-8dec-8dd3ca296561', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 12:11:00.921299+05:30');
INSERT INTO public.mastery_events VALUES ('933b5cba-8c4b-47d0-b6ef-02ed3208c9ea', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.442855+05:30');
INSERT INTO public.mastery_events VALUES ('280348c5-749b-48fd-8d01-d7dee402f1d9', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:15:31.545868+05:30');
INSERT INTO public.mastery_events VALUES ('48404f54-39ed-4990-8c2b-bec78d86ad39', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:15:31.64889+05:30');
INSERT INTO public.mastery_events VALUES ('33152a3b-e363-4998-b3be-1148c14e31c8', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'Riya S.', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted a1 - a2 instead of a2 - a1', '2026-08-28 14:20:06.905377+05:30');
INSERT INTO public.mastery_events VALUES ('3d5876f5-1f2e-423c-b13f-288085aa1531', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'Meera P.', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:20:07.57145+05:30');
INSERT INTO public.mastery_events VALUES ('f98a493c-6664-4904-86b0-140f75405b0d', 'ffe48f61-054d-4c8f-a46d-7bc49edfa510', 'sc_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:00:24.585483+05:30');
INSERT INTO public.mastery_events VALUES ('db3ae78b-ff7b-4096-9f68-3da785a320dc', '07385456-e20c-4a5c-a930-53abd0dec865', 'sc_student_1', 'Student', 'test-trig-chapter', 'T-01', 'mastery', NULL, '2026-08-28 12:12:14.502952+05:30');
INSERT INTO public.mastery_events VALUES ('73b84098-da5a-4409-bdb0-20abd1022d6c', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'Dev V.', 'chapter-05-arithmetic-progressions', 'AP-01', 'struggle', 'Assumed doubling pattern was an AP', '2026-08-28 14:20:08.269057+05:30');
INSERT INTO public.mastery_events VALUES ('b370aa91-d11e-439b-980e-c078ada96d78', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', 'e32bbc08-2634-451a-9656-872b019f6462', 'Naveen T.', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Divided by d before subtracting a', '2026-08-28 14:20:08.983378+05:30');
INSERT INTO public.mastery_events VALUES ('a27784b3-8fe7-468c-aad4-f3c7f85e59a7', '600b9c3c-5b0d-4564-988d-44b1e54cceef', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:24:12.537034+05:30');
INSERT INTO public.mastery_events VALUES ('6825c205-a970-4d0a-b3fb-42d81d4980de', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.171448+05:30');
INSERT INTO public.mastery_events VALUES ('ba1512dd-8c04-4bc1-a576-5d615fe65c42', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.412379+05:30');
INSERT INTO public.mastery_events VALUES ('8e01a03b-aa4f-43a9-af66-efd9f2673e84', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:13:09.642694+05:30');
INSERT INTO public.mastery_events VALUES ('55bc0871-0de9-4d0f-8d24-dbab6fc2abb8', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:13:09.871688+05:30');
INSERT INTO public.mastery_events VALUES ('be43ab60-8000-4129-af71-36925ebb20c4', '600b9c3c-5b0d-4564-988d-44b1e54cceef', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 14:24:13.722087+05:30');
INSERT INTO public.mastery_events VALUES ('83cdc2c6-9485-49ec-b5a0-1e37e2f7cac4', '3d1c34e2-f0aa-488c-8d62-0dbaee97b43a', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:55:07.911276+05:30');
INSERT INTO public.mastery_events VALUES ('de6dfa43-62d0-4137-8c21-7546fd9f63ca', '3d1c34e2-f0aa-488c-8d62-0dbaee97b43a', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 12:55:10.466699+05:30');
INSERT INTO public.mastery_events VALUES ('f4ea8922-715f-4ac0-b48b-f377fb06cee2', 'f419f3f7-4cac-4f7b-9f51-98832d73dba2', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:56:12.601569+05:30');
INSERT INTO public.mastery_events VALUES ('420b376c-1beb-45f6-b430-3f9a7ef279ea', 'f419f3f7-4cac-4f7b-9f51-98832d73dba2', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'stuck on AP-11', '2026-08-28 12:56:15.112275+05:30');
INSERT INTO public.mastery_events VALUES ('b310055e-5313-4c03-a3ad-b707f8852069', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:48.532824+05:30');
INSERT INTO public.mastery_events VALUES ('a6b9047c-f6ed-4b8f-9bae-c9504676eba7', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:48.788691+05:30');
INSERT INTO public.mastery_events VALUES ('e49d2907-a68e-4eff-b4db-d70ffb5a03f6', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:49.022696+05:30');
INSERT INTO public.mastery_events VALUES ('31ce5e8d-e2e5-44fd-9e35-a2c3df4efaac', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:57:49.262467+05:30');
INSERT INTO public.mastery_events VALUES ('a747b2c1-7315-4b64-8fcc-cf59c51a2693', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:57:49.414545+05:30');
INSERT INTO public.mastery_events VALUES ('18ac9bc8-7ce0-4d3d-a4e8-ecc7b2179020', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:57:49.598889+05:30');
INSERT INTO public.mastery_events VALUES ('3b359eee-a593-483a-b4ad-46e7aeacecc4', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.439839+05:30');
INSERT INTO public.mastery_events VALUES ('d1bd12f4-43a1-4157-be03-a10fe0cf4aff', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.541581+05:30');
INSERT INTO public.mastery_events VALUES ('4594b467-560a-46da-b8d5-22610a146f10', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:25:13.647671+05:30');
INSERT INTO public.mastery_events VALUES ('eab0bd6f-956e-40ed-9d39-2570d949b5e9', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:25:13.75584+05:30');
INSERT INTO public.mastery_events VALUES ('797d8c70-fa7e-477e-8e15-90d8271ea047', '1df4c01e-83c3-40c9-a8ff-73b2031b7976', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:32:05.824368+05:30');
INSERT INTO public.mastery_events VALUES ('b52429c2-bdbe-4b58-a1bd-69213729c0ab', '1df4c01e-83c3-40c9-a8ff-73b2031b7976', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 17:32:06.553104+05:30');
INSERT INTO public.mastery_events VALUES ('706f962b-6a35-4ce6-ac75-a057b8e98ee5', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.089507+05:30');
INSERT INTO public.mastery_events VALUES ('a403ac12-c3c7-49f1-9473-61fc3b3b0717', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.195269+05:30');
INSERT INTO public.mastery_events VALUES ('984fd25b-58aa-4970-97ee-0e65e0f52b43', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:01:17.089805+05:30');
INSERT INTO public.mastery_events VALUES ('be520b30-8130-46e6-8e3e-9935f750bc6a', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:01:17.182672+05:30');
INSERT INTO public.mastery_events VALUES ('3311424c-1a57-486f-9271-9499fe159995', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:01:17.258869+05:30');
INSERT INTO public.mastery_events VALUES ('3f8fc05a-8c42-476b-87da-3331c837f085', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:01:17.340068+05:30');
INSERT INTO public.mastery_events VALUES ('1edbd168-dc8e-4980-9b96-1a2d5a70653a', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:01:17.421634+05:30');
INSERT INTO public.mastery_events VALUES ('afccc227-726e-4f0b-b52c-8ff8da9a2dc9', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:01:17.499694+05:30');
INSERT INTO public.mastery_events VALUES ('a8f86048-5aa3-4e50-85d5-0f6b886b1b2e', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:01:17.575137+05:30');
INSERT INTO public.mastery_events VALUES ('e261e40c-fe99-45aa-a526-ed60b78ac749', 'a51f6861-9f5b-41af-87e8-4cc271ca291c', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'stuck on AP-11', '2026-08-28 12:07:59.31703+05:30');
INSERT INTO public.mastery_events VALUES ('ee9a9b6a-a4fc-4107-afa1-10b95fc105d9', '4836f463-00ea-416f-bfd3-0a2ca8103f3f', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:08:30.004173+05:30');
INSERT INTO public.mastery_events VALUES ('89ebcac4-1835-479b-9e07-faad055b329d', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.305541+05:30');
INSERT INTO public.mastery_events VALUES ('a621550c-611d-45c9-8452-1f2f6bdb2d15', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:15:31.476531+05:30');
INSERT INTO public.mastery_events VALUES ('ed4cb582-66ae-4a90-b6b2-054ba66b05f9', '6494db3f-62e5-4ae0-8dec-8dd3ca296561', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:10:59.266094+05:30');
INSERT INTO public.mastery_events VALUES ('895baab5-25f1-47c4-a939-b10fff86eb18', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:15:31.580581+05:30');
INSERT INTO public.mastery_events VALUES ('7a433c2b-562b-4007-9292-88883afdcc84', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'Riya S.', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:20:06.432523+05:30');
INSERT INTO public.mastery_events VALUES ('65ad3f49-f702-4718-9b64-852f97bc1293', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0719090b-783a-4fe1-9125-aaa0ebcbb5cc', 'Arjun K.', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:20:07.116622+05:30');
INSERT INTO public.mastery_events VALUES ('e6b43f82-1748-435c-a470-957824cc0101', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'Meera P.', 'chapter-05-arithmetic-progressions', 'AP-02', 'mastery', NULL, '2026-08-28 14:20:07.809779+05:30');
INSERT INTO public.mastery_events VALUES ('70961e45-0210-4f29-b9e7-1012a36fe58a', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'Dev V.', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Sign mistake moving a across the equals sign', '2026-08-28 14:20:08.499175+05:30');
INSERT INTO public.mastery_events VALUES ('ba8f5f8c-6d3d-42bb-a517-7e4bddbaad6e', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', 'e32bbc08-2634-451a-9656-872b019f6462', 'Naveen T.', 'chapter-05-arithmetic-progressions', 'AP-02', 'mastery', NULL, '2026-08-28 14:20:09.340208+05:30');
INSERT INTO public.mastery_events VALUES ('c2f636a0-6b83-4338-ae33-f2ad9117f0fe', '07385456-e20c-4a5c-a930-53abd0dec865', 'sc_student_1', 'Student', 'test-trig-chapter', 'T-02', 'mastery', NULL, '2026-08-28 12:12:14.58708+05:30');
INSERT INTO public.mastery_events VALUES ('d9b13c16-3e06-4f16-ae7a-6476bf9ea15a', '600b9c3c-5b0d-4564-988d-44b1e54cceef', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:24:12.932239+05:30');
INSERT INTO public.mastery_events VALUES ('2e941224-cb47-4b70-a93d-8d153452ad0e', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.004508+05:30');
INSERT INTO public.mastery_events VALUES ('47a65a02-d39e-4c99-aa97-3dafdd65acee', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.253188+05:30');
INSERT INTO public.mastery_events VALUES ('53421166-f8d1-4800-8fe6-732933804d3a', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:13:09.491468+05:30');
INSERT INTO public.mastery_events VALUES ('58e207d9-e8fd-4ae1-9f86-a380aca14343', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:13:09.717553+05:30');
INSERT INTO public.mastery_events VALUES ('62839fa5-fdb9-4013-ae18-16affafaab09', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:13:09.943343+05:30');
INSERT INTO public.mastery_events VALUES ('6c443f31-1e4e-4f7f-b8f3-a9caa42ec8b4', '3d1c34e2-f0aa-488c-8d62-0dbaee97b43a', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:55:08.788051+05:30');
INSERT INTO public.mastery_events VALUES ('53a9eba4-915d-4e13-9320-36fcce5fbca4', 'f419f3f7-4cac-4f7b-9f51-98832d73dba2', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'stuck on AP-05', '2026-08-28 12:56:13.420567+05:30');
INSERT INTO public.mastery_events VALUES ('da6a17b6-52f4-4018-9401-001f0ca1e4e8', 'f419f3f7-4cac-4f7b-9f51-98832d73dba2', 'ns_student_1', 'Student', 'chapter-05-arithmetic-progressions', 'AP-02', 'struggle', 'stuck on AP-02', '2026-08-28 12:56:15.988821+05:30');
INSERT INTO public.mastery_events VALUES ('941ff86d-8802-4e43-9727-50061420670a', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.375301+05:30');
INSERT INTO public.mastery_events VALUES ('78e6bcd4-8c0d-45a2-9b89-3e37ba7fa7ca', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.468878+05:30');
INSERT INTO public.mastery_events VALUES ('2027c140-b81f-41d8-856d-1b8c6c7371fc', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:48.627684+05:30');
INSERT INTO public.mastery_events VALUES ('0d3754ed-7b45-4bd7-97df-69651a140d48', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:48.865961+05:30');
INSERT INTO public.mastery_events VALUES ('51d91e92-2b9a-48fc-9d19-5720604f2322', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 12:57:49.102126+05:30');
INSERT INTO public.mastery_events VALUES ('a6ed16d5-116e-4822-883a-0f85101f2eb1', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:57:49.34339+05:30');
INSERT INTO public.mastery_events VALUES ('65357d88-7b86-4b4b-a846-3d063d6d1d84', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 12:57:49.516405+05:30');
INSERT INTO public.mastery_events VALUES ('a29118e9-55aa-4484-91cb-f2d6ef737880', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.576555+05:30');
INSERT INTO public.mastery_events VALUES ('4366685d-65e0-41f7-8230-ad3adcac1e94', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:25:13.683055+05:30');
INSERT INTO public.mastery_events VALUES ('d1dabeec-37f1-4b4d-944a-35236d0619ff', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:25:13.792575+05:30');
INSERT INTO public.mastery_events VALUES ('5ad4fab5-c4bd-45eb-a65a-a88a24a0fc18', '1df4c01e-83c3-40c9-a8ff-73b2031b7976', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:32:06.067958+05:30');
INSERT INTO public.mastery_events VALUES ('898a8d29-a13c-47ba-8b42-d2ed27067b26', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.125327+05:30');
INSERT INTO public.mastery_events VALUES ('e993ccae-a36e-41ef-831d-d6a4ea4891ef', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.228915+05:30');
INSERT INTO public.mastery_events VALUES ('bbf48ff4-2adf-4677-9835-6481393f58f5', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.305929+05:30');
INSERT INTO public.mastery_events VALUES ('ef8f1461-d960-428e-816e-fe132f3e5593', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 17:33:50.378132+05:30');
INSERT INTO public.mastery_events VALUES ('31f52d56-be09-4197-a49b-44c2bb8c0d98', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 17:33:50.462191+05:30');
INSERT INTO public.mastery_events VALUES ('d439f12c-d55c-42b3-9b29-d6ab0a3c5e99', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:15:31.337962+05:30');
INSERT INTO public.mastery_events VALUES ('1aa34047-bc1e-4d03-b2bb-7d097d93f644', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:15:31.509809+05:30');
INSERT INTO public.mastery_events VALUES ('00dbbff2-4ee2-4469-9993-093a5e39e7d8', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:15:31.614686+05:30');
INSERT INTO public.mastery_events VALUES ('9b79fe3b-edd2-4891-83cb-8a6ec307f572', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'Riya S.', 'chapter-05-arithmetic-progressions', 'AP-02', 'mastery', NULL, '2026-08-28 14:20:06.67203+05:30');
INSERT INTO public.mastery_events VALUES ('b15d9965-e8b3-4643-bf2a-2248453d9c71', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0719090b-783a-4fe1-9125-aaa0ebcbb5cc', 'Arjun K.', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Confused which term comes first in the subtraction', '2026-08-28 14:20:07.345001+05:30');
INSERT INTO public.mastery_events VALUES ('faed8ce7-2e70-4b61-8d6c-7b7a9402f2ac', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'Meera P.', 'chapter-05-arithmetic-progressions', 'AP-05', 'mastery', NULL, '2026-08-28 14:20:08.044429+05:30');
INSERT INTO public.mastery_events VALUES ('8edefdfc-d358-4e2a-be57-526504fa835a', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'Dev V.', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Still getting the sign wrong after re-teach', '2026-08-28 14:20:08.742434+05:30');
INSERT INTO public.mastery_events VALUES ('6444013b-390a-4f17-8fc6-22ccdf47a365', '600b9c3c-5b0d-4564-988d-44b1e54cceef', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:24:12.166858+05:30');
INSERT INTO public.mastery_events VALUES ('c7a0635a-fe91-48f5-b274-bcac51440861', '600b9c3c-5b0d-4564-988d-44b1e54cceef', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 14:24:13.346881+05:30');
INSERT INTO public.mastery_events VALUES ('b8fc8121-2c1f-45da-a644-fe839d1cd301', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'Riya S.', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 13:12:05.447405+05:30');
INSERT INTO public.mastery_events VALUES ('7c37ba25-9ea7-45bf-9a33-0cd94dcfa4d7', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'Riya S.', 'chapter-05-arithmetic-progressions', 'AP-02', 'mastery', NULL, '2026-08-28 13:12:05.704803+05:30');
INSERT INTO public.mastery_events VALUES ('4b0e316a-e0b8-412f-83a1-d44ddc147b7f', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'Riya S.', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted a1 - a2 instead of a2 - a1', '2026-08-28 13:12:06.147677+05:30');
INSERT INTO public.mastery_events VALUES ('afea328f-b81f-4433-8a7f-078adba0155c', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0719090b-783a-4fe1-9125-aaa0ebcbb5cc', 'Arjun K.', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 13:12:06.527858+05:30');
INSERT INTO public.mastery_events VALUES ('2eb00be7-cc90-423d-a122-dd7bd71ce4df', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0719090b-783a-4fe1-9125-aaa0ebcbb5cc', 'Arjun K.', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Confused which term comes first in the subtraction', '2026-08-28 13:12:06.950481+05:30');
INSERT INTO public.mastery_events VALUES ('817adf67-7f00-4664-9433-3be1cf5f0235', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'Meera P.', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 13:12:07.272662+05:30');
INSERT INTO public.mastery_events VALUES ('69ac47b0-adfc-4651-be23-b276f94ff8c0', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'Meera P.', 'chapter-05-arithmetic-progressions', 'AP-02', 'mastery', NULL, '2026-08-28 13:12:07.619637+05:30');
INSERT INTO public.mastery_events VALUES ('bad26c81-c59c-49c4-8e15-ed2a01420f97', 'ac3ca89a-7090-4639-8038-b7163ec572b2', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'Meera P.', 'chapter-05-arithmetic-progressions', 'AP-05', 'mastery', NULL, '2026-08-28 13:12:08.071145+05:30');
INSERT INTO public.mastery_events VALUES ('6c08af72-ea63-4203-82bf-fa9015426b18', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'Dev V.', 'chapter-05-arithmetic-progressions', 'AP-01', 'struggle', 'Assumed doubling pattern was an AP', '2026-08-28 13:12:08.44976+05:30');
INSERT INTO public.mastery_events VALUES ('d5f848f9-0d24-4b41-80c3-71f9d1785909', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'Dev V.', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Sign mistake moving a across the equals sign', '2026-08-28 13:12:08.785208+05:30');
INSERT INTO public.mastery_events VALUES ('4e2f25ec-cd1b-453c-b7ff-6490091c436d', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'Dev V.', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Still getting the sign wrong after re-teach', '2026-08-28 13:12:09.250995+05:30');
INSERT INTO public.mastery_events VALUES ('dd4dcbd7-3a38-4a68-80fa-e71f5c0a3ae3', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', 'e32bbc08-2634-451a-9656-872b019f6462', 'Naveen T.', 'chapter-05-arithmetic-progressions', 'AP-11', 'struggle', 'Divided by d before subtracting a', '2026-08-28 13:12:09.66065+05:30');
INSERT INTO public.mastery_events VALUES ('649f0283-27ee-4d45-852e-015d7305cfe1', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d', 'e32bbc08-2634-451a-9656-872b019f6462', 'Naveen T.', 'chapter-05-arithmetic-progressions', 'AP-02', 'mastery', NULL, '2026-08-28 13:12:10.09214+05:30');
INSERT INTO public.mastery_events VALUES ('aecad41a-f03a-4d9a-97d9-0141e40d24f1', 'class-10a', 'student_2', 'Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.40714+05:30');
INSERT INTO public.mastery_events VALUES ('4ad24571-a480-4eca-8ade-70ccfe40ef84', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.502669+05:30');
INSERT INTO public.mastery_events VALUES ('94bcab13-8460-4722-be19-8692d96ec647', 'class-10a', 'student_8', 'Student 8', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:25:13.61172+05:30');
INSERT INTO public.mastery_events VALUES ('90dd7bab-6ea9-46ed-a635-207622e54603', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:25:13.7179+05:30');
INSERT INTO public.mastery_events VALUES ('0862390a-811b-4377-8351-f398745a5551', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 14:25:13.826216+05:30');
INSERT INTO public.mastery_events VALUES ('0fb38b61-926a-4973-b03a-a7f810c587b0', '938f143c-1bed-46d2-9a23-fd4fda267df1', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:14:25.830966+05:30');
INSERT INTO public.mastery_events VALUES ('2936afe0-8291-4d0e-9c91-63566e729c15', '938f143c-1bed-46d2-9a23-fd4fda267df1', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:14:26.069313+05:30');
INSERT INTO public.mastery_events VALUES ('c20b143a-c431-47ce-bdf4-d6437d75b475', '938f143c-1bed-46d2-9a23-fd4fda267df1', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 14:14:26.312999+05:30');
INSERT INTO public.mastery_events VALUES ('954b8428-428a-475e-b1e2-19fb52957466', '938f143c-1bed-46d2-9a23-fd4fda267df1', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 14:14:26.563164+05:30');
INSERT INTO public.mastery_events VALUES ('10237410-1880-4af9-b0aa-0c66c5735595', '938f143c-1bed-46d2-9a23-fd4fda267df1', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 14:14:26.812599+05:30');
INSERT INTO public.mastery_events VALUES ('17e7a9b7-9eb1-495c-814b-741bb697df3a', '1df4c01e-83c3-40c9-a8ff-73b2031b7976', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:32:05.590278+05:30');
INSERT INTO public.mastery_events VALUES ('b93de6e0-b995-49b3-b0a7-8c1307b7752b', '1df4c01e-83c3-40c9-a8ff-73b2031b7976', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 17:32:06.305113+05:30');
INSERT INTO public.mastery_events VALUES ('213515b8-9b90-4333-adc4-b08f08ef3447', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.038861+05:30');
INSERT INTO public.mastery_events VALUES ('dadd06c9-5e73-49dc-a21d-390d9a95e430', 'class-10a', 'student_4', 'Student 4', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.159241+05:30');
INSERT INTO public.mastery_events VALUES ('1c3924fa-6d6e-41db-a739-0caccf5870a8', 'class-10a', 'student_7', 'Student 7', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 17:33:50.269729+05:30');
INSERT INTO public.mastery_events VALUES ('a74d573c-1bf1-4029-92e5-3f67e3255fb5', 'class-10a', 'student_1', 'Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 17:33:50.343093+05:30');
INSERT INTO public.mastery_events VALUES ('cbdfd2d5-0d0e-4c72-bf08-07adc95d410b', 'class-10a', 'student_3', 'Student 3', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 17:33:50.414842+05:30');
INSERT INTO public.mastery_events VALUES ('0aa8885e-92b6-47be-9b53-512fa11dbc97', 'class-10a', 'student_5', 'Student 5', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 17:33:50.503474+05:30');
INSERT INTO public.mastery_events VALUES ('d7e296bc-8d51-4d03-8f5c-1da7b1256800', 'class-10a', 'student_6', 'Student 6', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'Subtracted backwards a1 - a2 resulting in wrong positive d', '2026-08-28 17:33:50.540527+05:30');
INSERT INTO public.mastery_events VALUES ('d63214c3-4dad-48e8-9fa6-89e9e7bc69ec', 'bf8722e6-d8e7-487e-8acd-cb70b5f28004', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 22:34:04.80712+05:30');
INSERT INTO public.mastery_events VALUES ('4eae928f-75cb-45e7-b54d-e2270c4f4e82', 'bf8722e6-d8e7-487e-8acd-cb70b5f28004', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 22:34:05.206041+05:30');
INSERT INTO public.mastery_events VALUES ('628b3376-7add-452f-ac87-61e74a111a76', 'bf8722e6-d8e7-487e-8acd-cb70b5f28004', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 22:34:05.471845+05:30');
INSERT INTO public.mastery_events VALUES ('49355fab-eb19-4b2c-b0a1-a04fcd518010', 'bf8722e6-d8e7-487e-8acd-cb70b5f28004', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 22:34:05.814491+05:30');
INSERT INTO public.mastery_events VALUES ('0bb3841e-8522-4324-8689-08d602d31478', 'bf8722e6-d8e7-487e-8acd-cb70b5f28004', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 22:34:06.205645+05:30');
INSERT INTO public.mastery_events VALUES ('1107f875-74d2-42d0-98d1-a4e637ed68b4', '304d8bbf-fcbd-41c4-941e-6769408d5899', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 23:11:54.309307+05:30');
INSERT INTO public.mastery_events VALUES ('0da0aafb-5677-4fa0-81c7-805c38a03864', '304d8bbf-fcbd-41c4-941e-6769408d5899', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 23:11:54.542312+05:30');
INSERT INTO public.mastery_events VALUES ('c661cdb2-f518-4f00-abed-d2c1001dde65', '304d8bbf-fcbd-41c4-941e-6769408d5899', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-28 23:11:54.781689+05:30');
INSERT INTO public.mastery_events VALUES ('51fbaf34-3d76-4290-9446-986621f26f4b', '304d8bbf-fcbd-41c4-941e-6769408d5899', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 23:11:55.018261+05:30');
INSERT INTO public.mastery_events VALUES ('d602581a-83c5-4f79-bac5-25a31b31ae90', '304d8bbf-fcbd-41c4-941e-6769408d5899', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-28 23:11:55.251233+05:30');
INSERT INTO public.mastery_events VALUES ('b90d9b4c-6057-4786-9823-d376c1cdd637', 'e520b70e-6b30-405b-b38f-ae43a343051f', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-30 04:11:39.581616+05:30');
INSERT INTO public.mastery_events VALUES ('71aaf008-ca7a-4751-b087-0eb5e82fdafa', 'e520b70e-6b30-405b-b38f-ae43a343051f', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-30 04:11:39.955883+05:30');
INSERT INTO public.mastery_events VALUES ('17d6852a-fd49-4ca0-9016-5df738b81102', 'e520b70e-6b30-405b-b38f-ae43a343051f', 'sa_student_3', 'SA Student 3', 'chapter-05-arithmetic-progressions', 'AP-01', 'mastery', NULL, '2026-08-30 04:11:40.322155+05:30');
INSERT INTO public.mastery_events VALUES ('8ab83c4f-3bce-452a-9480-5a36a72d77e3', 'e520b70e-6b30-405b-b38f-ae43a343051f', 'sa_student_1', 'SA Student 1', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-30 04:11:40.64939+05:30');
INSERT INTO public.mastery_events VALUES ('93d8d6f2-939c-4dfb-8d99-5115dc41f457', 'e520b70e-6b30-405b-b38f-ae43a343051f', 'sa_student_2', 'SA Student 2', 'chapter-05-arithmetic-progressions', 'AP-05', 'struggle', 'integration test error', '2026-08-30 04:11:40.95082+05:30');


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.modules VALUES ('0b9a354f-233a-4c52-8169-1cbcdd91aefa', '728c369b-303b-4f08-b3ee-19ab8cdcd703', 'Real Numbers — Fundamental Theorem & Prime Factorization', 'VIDEO', 1, true, '2026-08-26 17:11:55.861047+05:30', '173c07e0-52b4-4686-a3d0-ee0fa412cd8b');
INSERT INTO public.modules VALUES ('2d818e44-6680-428f-ad93-7e16b2d22280', '3ac8b215-4403-42f4-8a8a-8928092f0136', 'Polynomials — Geometric Meaning of Zeroes & Coefficients', 'VIDEO', 1, true, '2026-08-26 17:12:45.587782+05:30', '224413f5-a239-4691-8fd2-57d04a0c3d49');
INSERT INTO public.modules VALUES ('526ba4cf-682a-4da3-b0b9-9419347b79ee', '99abce2e-4ac3-469d-9f36-376086a11aeb', 'Pair of Linear Equations in Two Variables — Graphical & Substitution Methods', 'VIDEO', 1, true, '2026-08-26 17:13:05.037876+05:30', 'e127d0e3-d62f-4e21-8d55-52d45804ce2c');
INSERT INTO public.modules VALUES ('b80664f1-696d-4f28-9072-0f1b5dabd707', '70230b14-0a20-4359-93ce-92c5b0edf645', 'Quadratic Equations — Formulation, Factorization & Discriminant', 'VIDEO', 1, true, '2026-08-26 17:13:27.614247+05:30', 'f240e20c-bbeb-4d0f-a48a-b0fa0fe1f4cc');
INSERT INTO public.modules VALUES ('be1f5f65-ecbe-4551-b464-7f8c9c057fe5', '528bcd38-578a-432c-ba75-a4c41a52c35e', 'Arithmetic Progressions — General Form & nth Term Formula', 'VIDEO', 1, true, '2026-08-26 17:13:51.373763+05:30', '016c474a-f923-41ce-860b-94e846614384');
INSERT INTO public.modules VALUES ('6ec170da-f3b4-4ec7-b459-dbba4396bfa9', '5dc28423-8aef-4f12-96df-dd982fa09401', 'Triangles — Basic Proportionality Theorem & Similarity Criteria', 'VIDEO', 1, true, '2026-08-26 17:14:15.567934+05:30', 'faf9c1b8-65e8-48ba-a482-51f7c992d99d');
INSERT INTO public.modules VALUES ('14ec2862-a1cf-4329-99d0-2fb9ecd36c22', '3b7fa967-1937-47b8-962f-274f8f4ff1b4', 'Coordinate Geometry — Distance & Section Formulae', 'VIDEO', 1, true, '2026-08-26 17:14:38.256955+05:30', '16bc997f-7ada-4a5c-b5a6-3f837a06900f');
INSERT INTO public.modules VALUES ('d55fcf19-d65b-4cef-8b7f-d3b5cbd03f4b', 'b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 'Life Processes — Nutrition in Plants and Animals', 'VIDEO', 1, true, '2026-08-12 16:01:53.09663+05:30', '5d1930da-0e3f-4d76-9a17-7201243f0d30');
INSERT INTO public.modules VALUES ('f000dedf-7f9f-4b00-ab9c-f1cbc93d8ee4', 'b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 'Life Processes — Transportation & Human Circulatory System', 'VIDEO', 2, true, '2026-08-12 20:47:00.852797+05:30', 'cd8f75b6-74ab-4650-92fa-7575169c0290');
INSERT INTO public.modules VALUES ('bf8c8c8a-971f-4b57-a2dc-2242832a01aa', 'b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 'Life Processes — Excretion & Nephron Structure', 'VIDEO', 3, true, '2026-08-26 17:16:14.034482+05:30', '3443a760-e35f-4973-bc48-427e1b88f55b');
INSERT INTO public.modules VALUES ('ddadefb9-8498-4173-9b97-63d9b4b99391', 'fff653c7-0029-45f2-897c-586de430efe7', 'Acids, Bases and Salts — Chemical Properties & pH Scale', 'VIDEO', 1, true, '2026-08-12 08:54:09.932825+05:30', '5965b042-489f-44af-abd8-c4c9bc58a0be');
INSERT INTO public.modules VALUES ('a71e8fef-0837-4233-9f22-3b4242b7f679', '166329af-e61b-492f-89a6-d379fdb3a052', 'Concave Mirror Exploration — Focal Length & Image Formation', 'VIDEO', 1, true, '2026-08-27 21:39:45.185305+05:30', '83da48df-a3bd-4121-80be-98420a3f996b');
INSERT INTO public.modules VALUES ('678426f4-061e-4629-a1fc-4eea64aafa1d', '9cebf036-77a4-45ab-b956-3c9f21dd390b', 'Resources and Development — Types, Land Use & Soil Conservation', 'VIDEO', 1, true, '2026-08-26 17:19:17.469874+05:30', '4bcdf406-779e-4347-8164-a34bc049c391');
INSERT INTO public.modules VALUES ('4261ec6b-d94b-49ab-bff6-474db6d24835', '3512d9e8-9108-41ea-8ac2-2dac06f04ba6', 'Development — Income, National Development & Human Development Index', 'VIDEO', 1, true, '2026-08-26 17:27:40.237096+05:30', '1a236459-73b4-4e7d-884d-85fd15f93e75');
INSERT INTO public.modules VALUES ('a96b71b1-8849-4f7f-8005-6ecdfd823237', 'fff653c7-0029-45f2-897c-586de430efe7', 'Test Lecture', 'VIDEO', 2, true, '2026-09-10 13:25:53.169188+05:30', NULL);


--
-- Data for Name: progress_events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.progress_events VALUES ('62101644-7d81-42d3-89a8-a604bcaf4e9b', NULL, 'ddadefb9-8498-4173-9b97-63d9b4b99391', 2, '40b42a20-9bb0-4dbc-ab66-6a12369b2e75', '2026-08-12 09:30:41.627545+05:30', 'e8057ceb-7647-4a2f-8218-0d2e0c6d3981');
INSERT INTO public.progress_events VALUES ('95967112-202c-42ae-ba0c-13971d5c22db', NULL, 'ddadefb9-8498-4173-9b97-63d9b4b99391', 9, '0ca005ae-dc65-4b8e-9ccb-ee8f96124372', '2026-08-25 13:06:01.183798+05:30', '533aa983-830d-4e73-92fd-6941da161305');
INSERT INTO public.progress_events VALUES ('7e9d76e4-718e-4907-9667-869ce53ee48a', NULL, '0b9a354f-233a-4c52-8169-1cbcdd91aefa', 30, '7d0572bb-4cd9-4e05-abff-b90421e89f8c', '2026-09-10 21:05:40.778739+05:30', '757cc2fd-4f41-4395-95c0-1ac2d46009e6');
INSERT INTO public.progress_events VALUES ('8b151dab-1c08-4cc1-aa6e-2151f015fbc7', NULL, '0b9a354f-233a-4c52-8169-1cbcdd91aefa', 10, '55d33036-8027-4832-b73a-c6b6ffdf0332', '2026-09-10 21:07:27.133694+05:30', 'f7230295-76e4-464e-89aa-f2c719c56f56');


--
-- Data for Name: question_bank; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quiz_configurations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: quiz_generated_sets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sections VALUES ('ac3ca89a-7090-4639-8038-b7163ec572b2', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', '9-A', '2026-08-28 13:08:18.822702+05:30', '9');
INSERT INTO public.sections VALUES ('d19af03c-9aa4-48b0-9b3d-699cdafb732d', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', '9-B', '2026-08-28 13:08:18.823494+05:30', '9');
INSERT INTO public.sections VALUES ('2db75bef-9913-4132-b9e9-8ee66f273cee', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', '10-A', '2026-08-28 14:18:24.548328+05:30', '10');
INSERT INTO public.sections VALUES ('0108adac-d24f-43c2-8828-b79c566c32ea', '78c63126-39e2-4c25-9bce-c053d29e9d19', 'E2E Section', '2026-08-29 07:52:01.857285+05:30', '9');
INSERT INTO public.sections VALUES ('52f96661-2cbf-423a-ace1-30e8c11a8357', 'eeaa33bd-f609-46ed-b2c5-8d30e61003b4', '9-A', '2026-08-29 08:10:16.749681+05:30', NULL);
INSERT INTO public.sections VALUES ('355ae393-2972-4526-be94-6c51c9075b63', 'eeaa33bd-f609-46ed-b2c5-8d30e61003b4', '9-B', '2026-08-29 08:10:16.750097+05:30', NULL);
INSERT INTO public.sections VALUES ('7e5b9ff8-f81f-4b81-b107-cc5fedea48cc', '015e828e-e35e-454a-83fc-a6417ca95e42', 'B Section', '2026-08-30 04:08:59.602741+05:30', '9');
INSERT INTO public.sections VALUES ('85b05906-c3a7-4fb2-9898-cfe702292ba0', '015e828e-e35e-454a-83fc-a6417ca95e42', 'A Section', '2026-08-30 04:08:59.610731+05:30', '9');
INSERT INTO public.sections VALUES ('a5aa9507-fcb3-44a2-9561-05f15423c8b9', '20d3a1c5-c67a-4f70-a5d7-978e200fcde5', 'AO-A', '2026-08-30 04:09:05.195221+05:30', NULL);
INSERT INTO public.sections VALUES ('559aab3f-4af4-4e2e-9174-a2f4fa779510', '20d3a1c5-c67a-4f70-a5d7-978e200fcde5', 'AO-B', '2026-08-30 04:09:05.448049+05:30', NULL);
INSERT INTO public.sections VALUES ('b9b3ea02-dab1-45db-a5a5-d441217043d4', '670c6539-af8d-4c92-ba11-70cc321dd0b7', 'AS-A', '2026-08-30 04:09:12.541379+05:30', '9');
INSERT INTO public.sections VALUES ('ecebd7d3-caf3-4972-90f8-ddcea8db7af1', '670c6539-af8d-4c92-ba11-70cc321dd0b7', 'AS-B', '2026-08-30 04:09:12.601484+05:30', '9');
INSERT INTO public.sections VALUES ('5f686684-b48c-42e3-9756-b6852b500a25', 'ab814925-3fd3-422d-bd56-5155eb88450b', 'MP-A', '2026-08-30 04:09:44.224496+05:30', NULL);
INSERT INTO public.sections VALUES ('673221a8-2cfb-4e46-a688-d4368a3dea5d', '457f9d5b-dd87-4d29-be1f-6188757bb332', 'SG-NoGrade', '2026-08-30 04:11:25.768548+05:30', NULL);
INSERT INTO public.sections VALUES ('4f03304a-0d64-4518-9804-dc64f6d5b1cd', '457f9d5b-dd87-4d29-be1f-6188757bb332', 'SG-9A', '2026-08-30 04:11:26.217463+05:30', '9');
INSERT INTO public.sections VALUES ('2bd42316-51f1-402a-9eb0-87d08c6c5854', '457f9d5b-dd87-4d29-be1f-6188757bb332', 'SG-9B', '2026-08-30 04:11:26.726708+05:30', '9');
INSERT INTO public.sections VALUES ('6acd39be-b125-489b-befe-05a71fca043c', '457f9d5b-dd87-4d29-be1f-6188757bb332', 'SG-10A', '2026-08-30 04:11:27.102216+05:30', '10');
INSERT INTO public.sections VALUES ('0fcf0833-a56c-4b40-9a44-6ee4a0f869d9', '9247d818-b236-447e-8c1c-e82c78b2b3a7', 'RS-A', '2026-08-30 04:11:30.991725+05:30', NULL);
INSERT INTO public.sections VALUES ('e520b70e-6b30-405b-b38f-ae43a343051f', 'd17cc3c6-bd16-43c0-99f0-545014152204', '9-Z', '2026-08-30 04:11:39.231452+05:30', NULL);
INSERT INTO public.sections VALUES ('fd3a9550-9cfb-4e92-908a-5d1a895e9cde', 'c0da6d4b-b166-4cc5-9fe2-10f7e40e711a', '9-B', '2026-08-30 04:11:46.323515+05:30', NULL);
INSERT INTO public.sections VALUES ('737361ed-fa75-4e59-97cb-20a7b35da2a7', 'c0da6d4b-b166-4cc5-9fe2-10f7e40e711a', '9-A', '2026-08-30 04:11:46.323515+05:30', NULL);
INSERT INTO public.sections VALUES ('e9ee3bbe-e2fe-4a10-951a-1030d068fc0e', '556c95a7-093f-4057-b6ac-bd9c9c70425f', '9-A', '2026-08-30 04:11:51.378405+05:30', NULL);
INSERT INTO public.sections VALUES ('e9630459-5af7-4460-981d-4f381f00394f', '2aa16fee-89de-48f8-b0fb-cdfc4b433bcf', 'SC-A', '2026-08-30 04:12:16.706404+05:30', NULL);


--
-- Data for Name: student_lab_submissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.student_progress VALUES (NULL, 'ddadefb9-8498-4173-9b97-63d9b4b99391', 'in_progress', 40, 2, '2026-08-12 09:30:41.627545+05:30', NULL, '6f0ec157-ec86-4129-a643-1e50ebe957f4', 'e8057ceb-7647-4a2f-8218-0d2e0c6d3981');
INSERT INTO public.student_progress VALUES (NULL, '0b9a354f-233a-4c52-8169-1cbcdd91aefa', 'in_progress', 42, 30, '2026-09-10 21:05:40.778739+05:30', NULL, '02c06bf6-e127-4bbc-8750-476f2dfe24e0', '757cc2fd-4f41-4395-95c0-1ac2d46009e6');
INSERT INTO public.student_progress VALUES (NULL, '0b9a354f-233a-4c52-8169-1cbcdd91aefa', 'in_progress', 55, 10, '2026-09-10 21:07:27.133694+05:30', NULL, '1e346aa1-abbe-48e8-9285-af0dcac598a0', 'f7230295-76e4-464e-89aa-f2c719c56f56');
INSERT INTO public.student_progress VALUES (NULL, 'ddadefb9-8498-4173-9b97-63d9b4b99391', 'in_progress', 2, 9, '2026-08-25 13:06:01.183798+05:30', NULL, '95039afc-4582-42c8-9033-1bece3d76a5d', '533aa983-830d-4e73-92fd-6941da161305');


--
-- Data for Name: student_quiz_attempts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.subjects VALUES ('63e5642e-20b6-4089-bdc2-a7512d5a8493', '6b947746-49f4-43f8-85b5-4a616ad85b2f', 'RichEditorE2E Subject', '10', NULL, 950, '2026-08-30 05:10:29.875174+05:30');
INSERT INTO public.subjects VALUES ('632d3188-45b9-446d-86a8-08be19e6eb4e', '78c63126-39e2-4c25-9bce-c053d29e9d19', 'CreateTestE2E Subject', '9', NULL, 960, '2026-08-30 05:13:35.501384+05:30');
INSERT INTO public.subjects VALUES ('4ff645af-3445-4d92-ae4e-2dd48086f8d4', NULL, 'Social Science', '10', NULL, 3, '2026-08-12 20:15:50.882067+05:30');
INSERT INTO public.subjects VALUES ('c2edacc0-fe59-49ae-ae08-6915ff0a018a', NULL, 'English', '10', NULL, 4, '2026-08-12 21:27:52.076817+05:30');
INSERT INTO public.subjects VALUES ('3b040e27-4c1d-4c1c-b3e8-1f92e75fe5e5', NULL, 'Science', '10', NULL, 2, '2026-08-12 08:48:56.593811+05:30');
INSERT INTO public.subjects VALUES ('3bceffeb-9732-4cf9-aea9-cbb2032d3c04', NULL, 'Mathematics', '10', NULL, 1, '2026-08-12 20:15:50.23649+05:30');


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.subscription_plans VALUES ('5b85451e-b231-4265-a4a3-d40c9205ba5c', 'SuggestedNextStepsTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('ec524492-a24d-433f-b3e6-04f0649c35db', 'Greenwood Demo Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('60a55d63-ede2-47bc-97ab-099e13c0af9f', 'VP Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('7bcede36-d342-47aa-81fc-c8673f120953', 'ActTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('a50268fa-2496-4738-817f-36a83a59b8f0', 'Tier 2 - Individual Video', 2, true, false, false, 4999, 'For personal exploration', 1);
INSERT INTO public.subscription_plans VALUES ('282db125-33b6-4c44-8627-660100ff1407', 'Tier 1 - School Video', 1, true, false, false, 24000, 'Video only curriculum', 10);
INSERT INTO public.subscription_plans VALUES ('ff70082f-63d8-4d6c-a33a-a53a04bc83f0', 'Tier 3 - Video + Lab', 3, true, true, false, 60000, 'For schools scaling digital', 25);
INSERT INTO public.subscription_plans VALUES ('27235154-9000-4f2a-8e59-23d4d0bc2abb', 'Tier 4 - Premium', 4, true, true, true, 96000, 'For full-stack co-teacher deployment', 25);
INSERT INTO public.subscription_plans VALUES ('d523fe9c-e173-4962-a363-3ece5d4f25ea', 'PracticeTestsE2E Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('9ad10e31-e7b3-46cb-8e2c-3ecdf5ab02a8', 'TestAssignTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('539ddc05-2414-469d-be8d-7aee6af6106e', 'AnalyticsOverviewTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('bb8c8fd6-5f55-4cae-aff9-c39a57f3092d', 'AnalyticsSectionTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('a7633396-67d1-4487-a604-384a016196d5', 'TreeVisTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('2cbb0ef6-ca1e-4a08-acb9-985fd9e7b442', 'LabExec Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('3b39c1c2-0a24-4f2c-b002-825d04970067', 'MisconceptionPatternTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('0ab77601-6db9-4ded-bbfa-07c4abc9e5d2', 'P2B Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('28d534ba-1d4f-4399-a88e-34c9a18970ba', 'PracticeChaptersTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('9da1ac04-f1a5-4a63-a1b8-c1fc24abfda1', 'PracticeCheckTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('c7ee262f-1c6d-4b52-941b-d9c8bb4b23de', 'PracticeGenTest Quiz Tenant Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('7745ce6f-20c1-4b38-8378-b1a41902188a', 'PracticeGenTest NoQuiz Tenant Plan', 1, true, true, false, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('ffd87e45-d68b-4ec9-9282-da19281e75c6', 'RichTextTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('f361c10d-515d-4279-95b5-e27c3f465c45', 'SectionGradeTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('48130c37-26ac-4b8a-8ed7-5be37919a219', 'RosterSizeTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('f761b528-ac45-4192-a936-709b494a7329', 'SectionsAnalyticsTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('4fba3cbd-ec10-4b22-865f-db4cdcccdb98', 'SectionsEndpointTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('a6ef1715-91cf-4c84-a828-1fcf064cc708', 'SectionsEndpointTest Other Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('58e8579d-9c4c-495c-ae8a-579dc84757cc', 'SectionsWriteTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('bf1213bd-99a3-45c8-9922-b6cfdb4f1369', 'SectionsWriteTest Other Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('7bf32bcd-d705-4c44-920b-685ee5d9a56c', 'StudentEngagementTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('a302fe0f-4dd5-471f-b1ad-79caefbd4438', 'StudentProfileTest Plan', 4, true, true, true, 0, '', 1);
INSERT INTO public.subscription_plans VALUES ('133342b7-d9e5-4dbb-89c3-413a8e3501a5', 'SubjectChapterTest Plan', 4, true, true, true, 0, '', 1);


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.subscriptions VALUES ('67bce1fa-57d7-43e2-a792-4f8c745971b8', '79b61565-27e9-480f-80a4-19863777f3a2', '5b85451e-b231-4265-a4a3-d40c9205ba5c', '2026-08-30', '2027-08-30', '2026-08-30 04:12:20.026505+05:30', 1);
INSERT INTO public.subscriptions VALUES ('3d7fc9cb-69fb-439b-8a9e-422704f08008', '6f9f8831-a04c-430a-879f-114c4a55c7d4', '282db125-33b6-4c44-8627-660100ff1407', '2026-07-11', '2026-09-09', '2026-08-10 22:10:05.446329+05:30', 1);
INSERT INTO public.subscriptions VALUES ('1ee072a0-77a0-44e2-afe2-9d12fcc4ed23', '499eff2a-78ca-42d2-97dd-6abcdf187638', 'a50268fa-2496-4738-817f-36a83a59b8f0', '2026-07-11', '2026-09-09', '2026-08-10 22:10:05.446329+05:30', 1);
INSERT INTO public.subscriptions VALUES ('2666ed04-e764-4295-934b-363034662976', 'd0d5aa50-bc2a-4f2c-b392-811bab9c3707', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2025-07-07', '2026-07-07', '2026-08-11 17:52:26.904591+05:30', 1);
INSERT INTO public.subscriptions VALUES ('cd9d29d4-925f-4f10-a178-8b8ad73c5444', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'ec524492-a24d-433f-b3e6-04f0649c35db', '2026-08-28', '2027-08-28', '2026-08-28 13:08:17.612653+05:30', 1);
INSERT INTO public.subscriptions VALUES ('32587e2d-433d-4feb-9c1e-1faeb522f270', '93e6bcb2-c577-44e5-90fc-9a6e02bbb9bd', '60a55d63-ede2-47bc-97ab-099e13c0af9f', '2026-01-01', '2027-01-01', '2026-08-28 17:35:36.780556+05:30', 2);
INSERT INTO public.subscriptions VALUES ('0ff96d33-164f-4979-96f6-f667c0cffe38', '424692a8-cb70-4204-b51f-427aaade2709', '282db125-33b6-4c44-8627-660100ff1407', '2026-01-01', '2027-12-31', '2026-08-12 08:56:20.788986+05:30', 5);
INSERT INTO public.subscriptions VALUES ('2562f029-7077-4094-8c6c-6eec032b5bdc', '695bb538-44f6-46a4-8708-bfbab0491750', '7bcede36-d342-47aa-81fc-c8673f120953', '2026-09-10', '2026-10-10', '2026-09-10 21:07:08.453083+05:30', 5);
INSERT INTO public.subscriptions VALUES ('fc6c3634-4814-4df5-88c4-12d3f25ba60a', '79beb589-b7fb-43ef-8b9b-e3ea05916de1', '7bcede36-d342-47aa-81fc-c8673f120953', '2026-07-12', '2026-08-11', '2026-09-10 21:07:08.460535+05:30', 1);
INSERT INTO public.subscriptions VALUES ('244e47e9-9c87-4df4-861e-cf9ac2e5c058', '8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-17', '2027-08-17', '2026-08-17 14:01:09.131775+05:30', 25);
INSERT INTO public.subscriptions VALUES ('155ba462-70b1-4a24-b8ce-92840a45c4f7', '847b1395-302b-4739-9933-567244797927', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-17', '2027-08-17', '2026-08-17 19:58:06.196936+05:30', 25);
INSERT INTO public.subscriptions VALUES ('7c3bff23-a287-40fd-b184-90b1f84d16ec', '4895c1b0-362c-4ec9-9f71-151dab3a3a1d', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-17', '2027-08-17', '2026-08-17 20:17:46.452685+05:30', 15);
INSERT INTO public.subscriptions VALUES ('48faafa9-2a85-4918-afb8-a9eda9170abe', 'cc18849d-5fe6-496b-bf04-ce1c19e5146d', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-19', '2027-08-19', '2026-08-19 09:04:53.125586+05:30', 25);
INSERT INTO public.subscriptions VALUES ('e65a19cc-6a81-4400-9b73-29abb8b8f990', '6a1c22c0-d426-4ba0-927b-b6fe56783ef0', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-07-11', '2026-09-18', '2026-08-10 22:10:05.446329+05:30', 5);
INSERT INTO public.subscriptions VALUES ('7ecf25e5-7a55-4fe7-b99b-eb1e9413d01e', 'cb6f6053-d291-4951-a392-508419a764e9', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-19', '2027-08-19', '2026-08-19 12:13:22.695999+05:30', 25);
INSERT INTO public.subscriptions VALUES ('ff0ac147-8d73-4014-9f92-07308d47a6ee', '08bb65c0-65b2-451a-a5ab-b8d4d24a2eb7', 'd523fe9c-e173-4962-a363-3ece5d4f25ea', '2026-08-29', '2027-08-29', '2026-08-29 08:09:22.638557+05:30', 1);
INSERT INTO public.subscriptions VALUES ('07b18eb3-8458-47c1-a9f7-0f83691f288d', 'eeaa33bd-f609-46ed-b2c5-8d30e61003b4', '9ad10e31-e7b3-46cb-8e2c-3ecdf5ab02a8', '2026-08-29', '2027-08-29', '2026-08-29 08:10:16.749199+05:30', 1);
INSERT INTO public.subscriptions VALUES ('b68599b5-dab9-44b2-a12d-6a2a9e78e5c7', '5f0d4f7d-f9b7-4327-876b-4cbf33a03c0b', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-24', '2027-08-24', '2026-08-24 16:59:22.932333+05:30', 25);
INSERT INTO public.subscriptions VALUES ('29aab5a0-8b01-4383-bf96-32988aa3dd25', '7c48313d-283c-4ca4-a570-40b08c3e487d', 'ff70082f-63d8-4d6c-a33a-a53a04bc83f0', '2026-08-24', '2027-08-24', '2026-08-24 17:00:34.372911+05:30', 25);
INSERT INTO public.subscriptions VALUES ('a733aa39-b5cd-4c4e-8fc5-50b90f120ee8', '02a7455f-ea42-4cab-a763-19f9d770fd22', '27235154-9000-4f2a-8e59-23d4d0bc2abb', '2026-08-24', '2027-08-24', '2026-08-24 17:00:34.758871+05:30', 25);
INSERT INTO public.subscriptions VALUES ('83e274ec-c363-4d88-a3f1-d918462c911a', '20d3a1c5-c67a-4f70-a5d7-978e200fcde5', '539ddc05-2414-469d-be8d-7aee6af6106e', '2026-08-30', '2027-08-30', '2026-08-30 04:09:04.189184+05:30', 1);
INSERT INTO public.subscriptions VALUES ('344e5389-c9c6-4132-8aab-ef63dd9a4923', '670c6539-af8d-4c92-ba11-70cc321dd0b7', 'bb8c8fd6-5f55-4cae-aff9-c39a57f3092d', '2026-08-30', '2027-08-30', '2026-08-30 04:09:12.059359+05:30', 1);
INSERT INTO public.subscriptions VALUES ('219ca1ca-fa68-4271-960b-3a63e97e2276', '93d9427a-25e7-4a19-a54e-90024e095b25', '2cbb0ef6-ca1e-4a08-acb9-985fd9e7b442', '2026-08-30', '2026-09-29', '2026-08-30 04:09:36.907958+05:30', 1);
INSERT INTO public.subscriptions VALUES ('8032bd30-d52b-4c65-bd38-d259551582f8', 'ab814925-3fd3-422d-bd56-5155eb88450b', '3b39c1c2-0a24-4f2c-b002-825d04970067', '2026-08-30', '2027-08-30', '2026-08-30 04:09:43.256867+05:30', 1);
INSERT INTO public.subscriptions VALUES ('94921b4e-0fbc-4694-901f-c5c4ea232abb', '2673eeba-e9c5-43c7-873d-2d41c3044482', '0ab77601-6db9-4ded-bbfa-07c4abc9e5d2', '2026-01-01', '2027-01-01', '2026-08-30 04:09:57.536585+05:30', 3);
INSERT INTO public.subscriptions VALUES ('b10bb901-d83d-4c88-a0c6-fd4632a0b3fc', 'bd1373a1-d8e3-443a-8a94-2c6efcea48cc', '28d534ba-1d4f-4399-a88e-34c9a18970ba', '2026-08-30', '2027-08-30', '2026-08-30 04:10:26.884815+05:30', 1);
INSERT INTO public.subscriptions VALUES ('bbf87e6b-6160-4040-aad9-643179ced827', 'b3509d8a-be46-40c4-a688-3c74b27eb6af', '9da1ac04-f1a5-4a63-a1b8-c1fc24abfda1', '2026-08-30', '2027-08-30', '2026-08-30 04:10:32.105008+05:30', 1);
INSERT INTO public.subscriptions VALUES ('6748d0cb-5222-46b2-ad52-ad689cd72cec', 'b5da2358-4cfa-49cc-9963-e18c50aa73ff', 'c7ee262f-1c6d-4b52-941b-d9c8bb4b23de', '2026-08-30', '2027-08-30', '2026-08-30 04:10:38.105905+05:30', 1);
INSERT INTO public.subscriptions VALUES ('7d3b6481-34fb-4dc4-adf7-1ab5237df7a7', 'a7da8631-1a6e-4f68-b34d-528d53718c1a', '7745ce6f-20c1-4b38-8378-b1a41902188a', '2026-08-30', '2027-08-30', '2026-08-30 04:10:38.109509+05:30', 1);
INSERT INTO public.subscriptions VALUES ('f34ac19f-f55b-4404-9ea1-8c98fd6cd848', 'b9bd6bed-fe4d-4919-8e33-e4d9119f1105', 'a7633396-67d1-4487-a604-384a016196d5', '2026-08-30', '2027-08-30', '2026-08-30 04:10:45.801664+05:30', 1);
INSERT INTO public.subscriptions VALUES ('1374a323-3580-4e2e-bb78-44891bb6585d', '33cde123-5dc4-406c-80cf-902c10a30130', 'ffd87e45-d68b-4ec9-9282-da19281e75c6', '2026-08-30', '2027-08-30', '2026-08-30 04:11:08.398454+05:30', 1);
INSERT INTO public.subscriptions VALUES ('143dea13-b49c-415f-a130-c4f98df62a90', '457f9d5b-dd87-4d29-be1f-6188757bb332', 'f361c10d-515d-4279-95b5-e27c3f465c45', '2026-08-30', '2027-08-30', '2026-08-30 04:11:24.597332+05:30', 1);
INSERT INTO public.subscriptions VALUES ('fe87239d-fe4f-4e7b-a609-a92fefc9701a', '9247d818-b236-447e-8c1c-e82c78b2b3a7', '48130c37-26ac-4b8a-8ed7-5be37919a219', '2026-08-30', '2027-08-30', '2026-08-30 04:11:29.946775+05:30', 1);
INSERT INTO public.subscriptions VALUES ('92ae776e-82c6-4e05-9227-b3fd8bd6b50a', 'd17cc3c6-bd16-43c0-99f0-545014152204', 'f761b528-ac45-4192-a936-709b494a7329', '2026-08-30', '2027-08-30', '2026-08-30 04:11:38.145194+05:30', 1);
INSERT INTO public.subscriptions VALUES ('ca7137d0-2484-4bb0-b142-9d913c9784b7', 'c0da6d4b-b166-4cc5-9fe2-10f7e40e711a', '4fba3cbd-ec10-4b22-865f-db4cdcccdb98', '2026-08-30', '2027-08-30', '2026-08-30 04:11:44.273459+05:30', 1);
INSERT INTO public.subscriptions VALUES ('d58fd8fc-a359-41d7-96a2-1baf1b55248c', '7e898ce1-3740-4b8a-a9f2-3a4ed091a692', 'a6ef1715-91cf-4c84-a828-1fcf064cc708', '2026-08-30', '2027-08-30', '2026-08-30 04:11:44.464273+05:30', 1);
INSERT INTO public.subscriptions VALUES ('2805b462-e74f-421c-8fcf-e084aa5652e8', '556c95a7-093f-4057-b6ac-bd9c9c70425f', '58e8579d-9c4c-495c-ae8a-579dc84757cc', '2026-08-30', '2027-08-30', '2026-08-30 04:11:49.57755+05:30', 1);
INSERT INTO public.subscriptions VALUES ('8f1e2276-f888-46db-a95c-721369b97e5b', '63d714b6-1251-421f-8628-cc7c2b1756ae', 'bf1213bd-99a3-45c8-9922-b6cfdb4f1369', '2026-08-30', '2027-08-30', '2026-08-30 04:11:49.783118+05:30', 1);
INSERT INTO public.subscriptions VALUES ('8805fb47-8e5d-4079-ac95-09032b376a30', '0822f950-b21f-457a-b9fa-5364d0ae4796', '7bf32bcd-d705-4c44-920b-685ee5d9a56c', '2026-08-30', '2027-08-30', '2026-08-30 04:12:10.232767+05:30', 1);
INSERT INTO public.subscriptions VALUES ('a2abf7a8-8f8f-499b-acb2-5f04645c4926', '747b5045-38a0-4257-a261-615d42e3fd78', 'a302fe0f-4dd5-471f-b1ad-79caefbd4438', '2026-08-30', '2027-08-30', '2026-08-30 04:12:13.309636+05:30', 1);
INSERT INTO public.subscriptions VALUES ('4b149e2a-4094-44f5-8032-b7f0084765a6', '2aa16fee-89de-48f8-b0fb-cdfc4b433bcf', '133342b7-d9e5-4dbb-89c3-413a8e3501a5', '2026-08-30', '2027-08-30', '2026-08-30 04:12:16.213042+05:30', 1);


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tenants VALUES ('457f9d5b-dd87-4d29-be1f-6188757bb332', 'SectionGradeTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:24.59596+05:30');
INSERT INTO public.tenants VALUES ('9247d818-b236-447e-8c1c-e82c78b2b3a7', 'RosterSizeTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:29.945512+05:30');
INSERT INTO public.tenants VALUES ('d17cc3c6-bd16-43c0-99f0-545014152204', 'SectionsAnalyticsTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:38.143924+05:30');
INSERT INTO public.tenants VALUES ('6f9f8831-a04c-430a-879f-114c4a55c7d4', 'TC1 School', 'SCHOOL', 'ACTIVE', '2026-08-10 22:10:05.446329+05:30');
INSERT INTO public.tenants VALUES ('499eff2a-78ca-42d2-97dd-6abcdf187638', 'TC2 Individual', 'INDIVIDUAL', 'ACTIVE', '2026-08-10 22:10:05.446329+05:30');
INSERT INTO public.tenants VALUES ('c0da6d4b-b166-4cc5-9fe2-10f7e40e711a', 'SectionsEndpointTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:44.271946+05:30');
INSERT INTO public.tenants VALUES ('6a1c22c0-d426-4ba0-927b-b6fe56783ef0', 'TC3 School', 'SCHOOL', 'ACTIVE', '2026-08-10 22:10:05.446329+05:30');
INSERT INTO public.tenants VALUES ('76702573-3bbe-4f30-b55e-0aa08213ae2d', 'Springfield School', 'SCHOOL', 'ACTIVE', '2026-08-10 22:32:18.807519+05:30');
INSERT INTO public.tenants VALUES ('2f7bc15b-888b-40ec-a93c-378986dc2734', 'Shelbyville School', 'SCHOOL', 'ACTIVE', '2026-08-11 12:10:21.071772+05:30');
INSERT INTO public.tenants VALUES ('aa9f9892-ca30-4b9f-9964-dd4db941d887', 'Edova Platform', 'PLATFORM', 'ACTIVE', '2026-08-11 17:23:56.37046+05:30');
INSERT INTO public.tenants VALUES ('d0d5aa50-bc2a-4f2c-b392-811bab9c3707', 'Expired School', 'SCHOOL', 'EXPIRED', '2026-08-11 17:52:26.90386+05:30');
INSERT INTO public.tenants VALUES ('7e898ce1-3740-4b8a-a9f2-3a4ed091a692', 'SectionsEndpointTest Other Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:44.463803+05:30');
INSERT INTO public.tenants VALUES ('556c95a7-093f-4057-b6ac-bd9c9c70425f', 'SectionsWriteTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:49.575863+05:30');
INSERT INTO public.tenants VALUES ('63d714b6-1251-421f-8628-cc7c2b1756ae', 'SectionsWriteTest Other Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:49.782438+05:30');
INSERT INTO public.tenants VALUES ('0822f950-b21f-457a-b9fa-5364d0ae4796', 'StudentEngagementTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:12:10.224673+05:30');
INSERT INTO public.tenants VALUES ('747b5045-38a0-4257-a261-615d42e3fd78', 'StudentProfileTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:12:13.308169+05:30');
INSERT INTO public.tenants VALUES ('2aa16fee-89de-48f8-b0fb-cdfc4b433bcf', 'SubjectChapterTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:12:16.211337+05:30');
INSERT INTO public.tenants VALUES ('79b61565-27e9-480f-80a4-19863777f3a2', 'SuggestedNextStepsTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:12:20.025268+05:30');
INSERT INTO public.tenants VALUES ('424692a8-cb70-4204-b51f-427aaade2709', 'E2E Demo School', 'SCHOOL', 'ACTIVE', '2026-08-12 08:55:57.349602+05:30');
INSERT INTO public.tenants VALUES ('103296d6-9199-4096-9cb8-b5506a4f9bd6', 'Vani Vidhyashram High School', 'SCHOOL', 'ACTIVE', '2026-08-17 13:51:07.651484+05:30');
INSERT INTO public.tenants VALUES ('8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109', 'Vani Vidhyasharam High school', 'SCHOOL', 'ACTIVE', '2026-08-17 14:01:09.034201+05:30');
INSERT INTO public.tenants VALUES ('847b1395-302b-4739-9933-567244797927', 'Demo Public School', 'SCHOOL', 'ACTIVE', '2026-08-17 19:57:48.826489+05:30');
INSERT INTO public.tenants VALUES ('4895c1b0-362c-4ec9-9f71-151dab3a3a1d', 'Chettinad Vidyashram', 'SCHOOL', 'ACTIVE', '2026-08-17 20:17:33.273118+05:30');
INSERT INTO public.tenants VALUES ('cc18849d-5fe6-496b-bf04-ce1c19e5146d', 'Smoke School', 'SCHOOL', 'ACTIVE', '2026-08-19 09:04:52.861699+05:30');
INSERT INTO public.tenants VALUES ('cb6f6053-d291-4951-a392-508419a764e9', 'Smoke School', 'SCHOOL', 'ACTIVE', '2026-08-19 12:13:22.613399+05:30');
INSERT INTO public.tenants VALUES ('78c63126-39e2-4c25-9bce-c053d29e9d19', 'CreateTestE2E Tenant', 'SCHOOL', 'ACTIVE', '2026-08-29 07:52:01.854444+05:30');
INSERT INTO public.tenants VALUES ('695bb538-44f6-46a4-8708-bfbab0491750', 'ActTest School', 'SCHOOL', 'ACTIVE', '2026-09-10 21:07:08.447602+05:30');
INSERT INTO public.tenants VALUES ('79beb589-b7fb-43ef-8b9b-e3ea05916de1', 'ActTest Expired', 'SCHOOL', 'ACTIVE', '2026-09-10 21:07:08.460196+05:30');
INSERT INTO public.tenants VALUES ('5f0d4f7d-f9b7-4327-876b-4cbf33a03c0b', 'Smoke School', 'SCHOOL', 'ACTIVE', '2026-08-24 16:59:22.861443+05:30');
INSERT INTO public.tenants VALUES ('7c48313d-283c-4ca4-a570-40b08c3e487d', 'Springfield Science Academy', 'SCHOOL', 'ACTIVE', '2026-08-24 17:00:34.258833+05:30');
INSERT INTO public.tenants VALUES ('02a7455f-ea42-4cab-a763-19f9d770fd22', 'Westfield Co-Teacher Model School', 'SCHOOL', 'ACTIVE', '2026-08-24 17:00:34.652494+05:30');
INSERT INTO public.tenants VALUES ('b9bd6bed-fe4d-4919-8e33-e4d9119f1105', 'QA Fixtures Tenant', 'SCHOOL', 'ACTIVE', '2026-08-28 08:35:29.58387+05:30');
INSERT INTO public.tenants VALUES ('08bb65c0-65b2-451a-a5ab-b8d4d24a2eb7', 'PracticeTestsE2E Tenant', 'SCHOOL', 'ACTIVE', '2026-08-29 08:09:22.637308+05:30');
INSERT INTO public.tenants VALUES ('eeaa33bd-f609-46ed-b2c5-8d30e61003b4', 'TestAssignTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-29 08:10:16.747975+05:30');
INSERT INTO public.tenants VALUES ('e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'Greenwood Demo School', 'SCHOOL', 'ACTIVE', '2026-08-28 13:08:17.601375+05:30');
INSERT INTO public.tenants VALUES ('015e828e-e35e-454a-83fc-a6417ca95e42', 'AdminChSecTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:08:59.600978+05:30');
INSERT INTO public.tenants VALUES ('20d3a1c5-c67a-4f70-a5d7-978e200fcde5', 'AnalyticsOverviewTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:09:04.187828+05:30');
INSERT INTO public.tenants VALUES ('670c6539-af8d-4c92-ba11-70cc321dd0b7', 'AnalyticsSectionTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:09:12.057677+05:30');
INSERT INTO public.tenants VALUES ('93e6bcb2-c577-44e5-90fc-9a6e02bbb9bd', 'VP School', 'SCHOOL', 'ACTIVE', '2026-08-28 17:35:36.322903+05:30');
INSERT INTO public.tenants VALUES ('6b947746-49f4-43f8-85b5-4a616ad85b2f', 'RichEditorE2E Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:09:36.491991+05:30');
INSERT INTO public.tenants VALUES ('93d9427a-25e7-4a19-a54e-90024e095b25', 'LabExec School', 'SCHOOL', 'ACTIVE', '2026-08-30 04:09:36.907502+05:30');
INSERT INTO public.tenants VALUES ('ab814925-3fd3-422d-bd56-5155eb88450b', 'MisconceptionPatternTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:09:43.255561+05:30');
INSERT INTO public.tenants VALUES ('2673eeba-e9c5-43c7-873d-2d41c3044482', 'P2B School', 'SCHOOL', 'ACTIVE', '2026-08-30 04:09:56.762988+05:30');
INSERT INTO public.tenants VALUES ('bd1373a1-d8e3-443a-8a94-2c6efcea48cc', 'PracticeChaptersTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:26.883162+05:30');
INSERT INTO public.tenants VALUES ('b3509d8a-be46-40c4-a688-3c74b27eb6af', 'PracticeCheckTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:32.103453+05:30');
INSERT INTO public.tenants VALUES ('cc4115a7-132c-471b-92da-3622ff8a7e08', 'PracticeCheckTest Other Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:32.304709+05:30');
INSERT INTO public.tenants VALUES ('b5da2358-4cfa-49cc-9963-e18c50aa73ff', 'PracticeGenTest Quiz Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:38.104501+05:30');
INSERT INTO public.tenants VALUES ('a7da8631-1a6e-4f68-b34d-528d53718c1a', 'PracticeGenTest NoQuiz Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:38.109046+05:30');
INSERT INTO public.tenants VALUES ('53170a7f-6c36-4ae4-b678-3ba74aaabaca', 'PracticeGenTest Other Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:38.112195+05:30');
INSERT INTO public.tenants VALUES ('b74b6efd-6383-43dd-87b0-af95dd01dee2', 'DraftSaveTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:10:50.976222+05:30');
INSERT INTO public.tenants VALUES ('33cde123-5dc4-406c-80cf-902c10a30130', 'RichTextTest Tenant', 'SCHOOL', 'ACTIVE', '2026-08-30 04:11:08.397149+05:30');
INSERT INTO public.tenants VALUES ('4c49d0fd-ac30-40a2-8119-e5888e141a93', 'Edova Platform', 'PLATFORM', 'ACTIVE', '2026-09-11 16:30:44.485998+05:30');


--
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.topics VALUES ('173c07e0-52b4-4686-a3d0-ee0fa412cd8b', '728c369b-303b-4f08-b3ee-19ab8cdcd703', 'Fundamental Theorem of Arithmetic', 1, '2026-08-26 17:11:55.86014+05:30');
INSERT INTO public.topics VALUES ('224413f5-a239-4691-8fd2-57d04a0c3d49', '3ac8b215-4403-42f4-8a8a-8928092f0136', 'Geometric Zeroes', 1, '2026-08-26 17:12:45.587242+05:30');
INSERT INTO public.topics VALUES ('e127d0e3-d62f-4e21-8d55-52d45804ce2c', '99abce2e-4ac3-469d-9f36-376086a11aeb', 'Graphical and Algebraic Solutions', 1, '2026-08-26 17:13:05.037423+05:30');
INSERT INTO public.topics VALUES ('f240e20c-bbeb-4d0f-a48a-b0fa0fe1f4cc', '70230b14-0a20-4359-93ce-92c5b0edf645', 'Standard Form & Nature of Roots', 1, '2026-08-26 17:13:27.613656+05:30');
INSERT INTO public.topics VALUES ('016c474a-f923-41ce-860b-94e846614384', '528bcd38-578a-432c-ba75-a4c41a52c35e', 'nth Term & Sum of Terms', 1, '2026-08-26 17:13:51.373104+05:30');
INSERT INTO public.topics VALUES ('faf9c1b8-65e8-48ba-a482-51f7c992d99d', '5dc28423-8aef-4f12-96df-dd982fa09401', 'Similarity Criteria', 1, '2026-08-26 17:14:15.567353+05:30');
INSERT INTO public.topics VALUES ('16bc997f-7ada-4a5c-b5a6-3f837a06900f', '3b7fa967-1937-47b8-962f-274f8f4ff1b4', 'Distance & Section Formula', 1, '2026-08-26 17:14:38.256074+05:30');
INSERT INTO public.topics VALUES ('5d1930da-0e3f-4d76-9a17-7201243f0d30', 'b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 'Nutrition', 1, '2026-08-12 16:01:52.799736+05:30');
INSERT INTO public.topics VALUES ('cd8f75b6-74ab-4650-92fa-7575169c0290', 'b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 'Transportation', 2, '2026-08-12 20:47:00.54474+05:30');
INSERT INTO public.topics VALUES ('3443a760-e35f-4973-bc48-427e1b88f55b', 'b07ebc32-d255-495f-9fdd-3b2f547ee6d7', 'Excretion', 3, '2026-08-26 17:16:14.034053+05:30');
INSERT INTO public.topics VALUES ('5965b042-489f-44af-abd8-c4c9bc58a0be', 'fff653c7-0029-45f2-897c-586de430efe7', 'Acid Base Reactions', 1, '2026-08-12 08:50:16.012658+05:30');
INSERT INTO public.topics VALUES ('4bcdf406-779e-4347-8164-a34bc049c391', '9cebf036-77a4-45ab-b956-3c9f21dd390b', 'Resource Planning', 1, '2026-08-26 17:19:17.468604+05:30');
INSERT INTO public.topics VALUES ('1a236459-73b4-4e7d-884d-85fd15f93e75', '3512d9e8-9108-41ea-8ac2-2dac06f04ba6', 'Economic Indicators', 1, '2026-08-26 17:27:40.235768+05:30');
INSERT INTO public.topics VALUES ('83da48df-a3bd-4121-80be-98420a3f996b', '166329af-e61b-492f-89a6-d379fdb3a052', 'Spherical Mirrors', 1, '2026-08-27 21:39:45.18456+05:30');


--
-- Data for Name: trig_concepts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trig_concepts VALUES ('trig-101', 'Right-Angled Triangle Anatomy', 'Introduction to Trigonometry', 1, 'Master the side relationships (Hypotenuse, Opposite, Adjacent) and Pythagorean Theorem in right-angled triangles.', 'AC^2 = AB^2 + BC^2 | sin(A) = Opp / Hyp', '{"problem_id": "p101_1", "context": "In triangle ABC right-angled at B, AB = 24 cm and BC = 7 cm. Find: (i) the length of hypotenuse AC, (ii) \\sin(A).", "initial_state": "AB = 24, BC = 7, \\angle B = 90^\\circ", "steps": [{"step_index": 0, "prompt": "Step 1: Calculate the length of the Hypotenuse AC using the Pythagorean Theorem (AC = sqrt(24^2 + 7^2)).", "expected_math": "25", "expected_latex": "AC = 25\\text{ cm}", "hints": {"high": "Use the Pythagorean theorem: AC = sqrt(24^2 + 7^2) = sqrt(576 + 49) = sqrt(625). What is sqrt(625)?", "mid": "Compute 24^2 + 7^2 and take the square root to find AC.", "low": "Find AC using AC^2 = AB^2 + BC^2."}, "quick_options": ["25", "26", "23", "sqrt(625)"]}, {"step_index": 1, "prompt": "Step 2: With respect to angle A, find the value of sin(A) = Opposite / Hypotenuse = BC / AC.", "expected_math": "7/25", "expected_latex": "\\sin(A) = \\frac{7}{25}", "hints": {"high": "For angle A, the opposite side is BC = 7 and hypotenuse is AC = 25. Write the fraction 7/25.", "mid": "Recall that sin(A) = Opposite / Hypotenuse. Substitute BC = 7 and AC = 25.", "low": "Express sin(A) as BC / AC."}, "quick_options": ["7/25", "24/25", "7/24", "25/7"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-102', 'Primary Trigonometric Ratios (sin, cos, tan)', 'Introduction to Trigonometry', 1.5, 'Define and calculate sine, cosine, and tangent ratios for acute angles.', 'sin(theta) = Opp/Hyp | cos(theta) = Adj/Hyp | tan(theta) = Opp/Adj', '{"problem_id": "p102_1", "context": "In a right-angled triangle with acute angle A, given that \\tan(A) = \\frac{4}{3}, find the hypotenuse and the trigonometric ratio \\cos(A).", "initial_state": "\\tan(A) = \\frac{4}{3} = \\frac{\\text{Opposite}}{\\text{Adjacent}}", "steps": [{"step_index": 0, "prompt": "Step 1: If Opposite = 4k and Adjacent = 3k, find the Hypotenuse k-multiple (sqrt(4^2 + 3^2)).", "expected_math": "5", "expected_latex": "\\text{Hypotenuse} = 5", "hints": {"high": "Hypotenuse = sqrt(4^2 + 3^2) = sqrt(16 + 9) = sqrt(25) = 5.", "mid": "Apply the Pythagorean theorem to 3 and 4.", "low": "Find the hypotenuse from opposite 4 and adjacent 3."}, "quick_options": ["5", "7", "sqrt(7)", "25"]}, {"step_index": 1, "prompt": "Step 2: Find the primary ratio cos(A) = Adjacent / Hypotenuse.", "expected_math": "3/5", "expected_latex": "\\cos(A) = \\frac{3}{5}", "hints": {"high": "cos(A) = Adjacent / Hypotenuse = 3 / 5.", "mid": "Use cos(A) = Adjacent / Hypotenuse.", "low": "What is the ratio of adjacent (3) to hypotenuse (5)?"}, "quick_options": ["3/5", "4/5", "3/4", "5/3"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-103', 'Reciprocal Trigonometric Ratios (cosec, sec, cot)', 'Introduction to Trigonometry', 1.8, 'Evaluate cosecant, secant, and cotangent as reciprocals of sine, cosine, and tangent.', 'cosec(theta) = 1/sin(theta) | sec(theta) = 1/cos(theta) | cot(theta) = 1/tan(theta)', '{"problem_id": "p103_1", "context": "In a right triangle with acute angle \\theta, given that \\sec(\\theta) = \\frac{13}{12}, find the opposite side and calculate \\cot(\\theta).", "initial_state": "\\sec(\\theta) = \\frac{13}{12} = \\frac{\\text{Hypotenuse}}{\\text{Adjacent}}", "steps": [{"step_index": 0, "prompt": "Step 1: Find the Opposite side length given Hypotenuse = 13 and Adjacent = 12.", "expected_math": "5", "expected_latex": "\\text{Opposite} = \\sqrt{13^2 - 12^2} = 5", "hints": {"high": "Opposite = sqrt(13^2 - 12^2) = sqrt(169 - 144) = sqrt(25) = 5.", "mid": "Use Opposite^2 = Hypotenuse^2 - Adjacent^2.", "low": "Calculate sqrt(169 - 144)."}, "quick_options": ["5", "1", "sqrt(313)", "25"]}, {"step_index": 1, "prompt": "Step 2: Calculate the reciprocal ratio cot(theta) = Adjacent / Opposite.", "expected_math": "12/5", "expected_latex": "\\cot(\\theta) = \\frac{12}{5}", "hints": {"high": "cot(theta) is Adjacent / Opposite = 12 / 5.", "mid": "cot(theta) is the reciprocal of tan(theta). Substitute 12 and 5.", "low": "Express Adjacent (12) over Opposite (5)."}, "quick_options": ["12/5", "5/12", "13/5", "5/13"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-104', 'Quotient & Product Relations', 'Introduction to Trigonometry', 2, 'Apply quotient identities tan(theta) = sin(theta)/cos(theta) and cot(theta) = cos(theta)/sin(theta).', 'tan(theta) = sin(theta)/cos(theta) | cot(theta) = cos(theta)/sin(theta)', '{"problem_id": "p104_1", "context": "Simplify the algebraic trigonometric expression: (tan(theta) * cos(theta)) / sin(theta).", "initial_state": "\\frac{\\tan(\\theta) \\cdot \\cos(\\theta)}{\\sin(\\theta)}", "steps": [{"step_index": 0, "prompt": "Step 1: Rewrite tan(theta) using the quotient relation (sin(theta)/cos(theta)) and simplify tan(theta) * cos(theta).", "expected_math": "sin(theta)", "expected_latex": "\\tan(\\theta) \\cdot \\cos(\\theta) = \\sin(\\theta)", "hints": {"high": "Substitute tan(theta) = sin(theta)/cos(theta). Notice cos(theta) cancels out to leave sin(theta).", "mid": "Replace tan(theta) with sin(theta)/cos(theta) and multiply by cos(theta).", "low": "What is (sin(theta)/cos(theta)) * cos(theta)?"}, "quick_options": ["sin(theta)", "cos(theta)", "1", "tan(theta)"]}, {"step_index": 1, "prompt": "Step 2: Now evaluate sin(theta) / sin(theta) to get the final simplified integer value.", "expected_math": "1", "expected_latex": "1", "hints": {"high": "Any non-zero expression divided by itself equals 1.", "mid": "Simplify sin(theta) / sin(theta).", "low": "What is x / x?"}, "quick_options": ["1", "0", "sin(theta)", "-1"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-105', 'Trigonometric Ratios of Standard Angles', 'Introduction to Trigonometry', 2.5, 'Evaluate exact values of standard angles (0 deg, 30 deg, 45 deg, 60 deg, 90 deg).', 'sin(30)=1/2 | cos(30)=sqrt(3)/2 | tan(45)=1 | sin(60)=sqrt(3)/2', '{"problem_id": "p105_1", "context": "Evaluate: 2*tan^2(45 deg) + cos^2(30 deg) - sin^2(60 deg).", "initial_state": "2\\tan^2(45^\\circ) + \\cos^2(30^\\circ) - \\sin^2(60^\\circ)", "steps": [{"step_index": 0, "prompt": "Step 1: Evaluate the first term: 2 * tan^2(45 deg). Note that tan(45 deg) = 1.", "expected_math": "2", "expected_latex": "2(1)^2 = 2", "hints": {"high": "tan(45 deg) = 1, so 2 * (1)^2 = 2 * 1 = 2.", "mid": "Substitute tan(45 deg) = 1 into 2 * tan^2(45 deg).", "low": "Evaluate 2 * (1)^2."}, "quick_options": ["2", "1", "4", "0"]}, {"step_index": 1, "prompt": "Step 2: Since cos(30 deg) = sqrt(3)/2 and sin(60 deg) = sqrt(3)/2, what is cos^2(30 deg) - sin^2(60 deg)?", "expected_math": "0", "expected_latex": "\\left(\\frac{\\sqrt{3}}{2}\\right)^2 - \\left(\\frac{\\sqrt{3}}{2}\\right)^2 = 0", "hints": {"high": "(sqrt(3)/2)^2 - (sqrt(3)/2)^2 = 3/4 - 3/4 = 0.", "mid": "Both terms are equal to 3/4. Subtracting them gives 0.", "low": "Subtract 3/4 - 3/4."}, "quick_options": ["0", "3/4", "3/2", "1"]}, {"step_index": 2, "prompt": "Step 3: Combine all terms: 2 + 0 to find the total expression value.", "expected_math": "2", "expected_latex": "2 + 0 = 2", "hints": {"high": "The total is 2 + 0 = 2.", "mid": "Add the first term (2) to the difference (0).", "low": "What is 2 + 0?"}, "quick_options": ["2", "0", "1", "4"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-106', 'The Core Pythagorean Identity (sin^2 theta + cos^2 theta = 1)', 'Trigonometric Identities', 3.2, 'Prove and apply the fundamental identity sin^2 theta + cos^2 theta = 1 in transformations.', 'sin^2(theta) + cos^2(theta) = 1 | sin^2(theta) = 1 - cos^2(theta)', '{"problem_id": "p106_1", "context": "Simplify: (1 - cos^2(theta)) * cosec^2(theta).", "initial_state": "(1 - \\cos^2(\\theta)) \\cdot \\csc^2(\\theta)", "steps": [{"step_index": 0, "prompt": "Step 1: Using sin^2(theta) + cos^2(theta) = 1, rewrite (1 - cos^2(theta)) in terms of sine.", "expected_math": "sin(theta)^2", "expected_latex": "1 - \\cos^2(\\theta) = \\sin^2(\\theta)", "hints": {"high": "From sin^2(theta) + cos^2(theta) = 1, we get 1 - cos^2(theta) = sin^2(theta).", "mid": "Isolate sin^2(theta) in the Pythagorean identity.", "low": "What is 1 - cos^2(theta) equal to?"}, "quick_options": ["sin(theta)^2", "cos(theta)^2", "tan(theta)^2", "1"]}, {"step_index": 1, "prompt": "Step 2: Multiply sin^2(theta) * cosec^2(theta) using the reciprocal relation cosec(theta) = 1/sin(theta).", "expected_math": "1", "expected_latex": "\\sin^2(\\theta) \\cdot \\frac{1}{\\sin^2(\\theta)} = 1", "hints": {"high": "sin^2(theta) * (1/sin^2(theta)) = 1.", "mid": "Substitute cosec^2(theta) = 1/sin^2(theta) and simplify.", "low": "Multiply sin^2(theta) by its reciprocal."}, "quick_options": ["1", "sin(theta)", "cosec(theta)", "0"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-107', 'Derived Pythagorean Identities', 'Trigonometric Identities', 3.8, 'Derive and utilize 1 + tan^2 theta = sec^2 theta and 1 + cot^2 theta = cosec^2 theta.', '1 + tan^2(theta) = sec^2(theta) | 1 + cot^2(theta) = cosec^2(theta)', '{"problem_id": "p107_1", "context": "Simplify: (sec^2(theta) - 1) * (cosec^2(theta) - 1).", "initial_state": "(\\sec^2(\\theta) - 1)(\\csc^2(\\theta) - 1)", "steps": [{"step_index": 0, "prompt": "Step 1: Rewrite (sec^2(theta) - 1) using the derived identity 1 + tan^2(theta) = sec^2(theta).", "expected_math": "tan(theta)^2", "expected_latex": "\\sec^2(\\theta) - 1 = \\tan^2(\\theta)", "hints": {"high": "Subtract 1 from both sides of 1 + tan^2(theta) = sec^2(theta) to get tan^2(theta).", "mid": "Use 1 + tan^2(theta) = sec^2(theta).", "low": "What is sec^2(theta) - 1?"}, "quick_options": ["tan(theta)^2", "cot(theta)^2", "sin(theta)^2", "1"]}, {"step_index": 1, "prompt": "Step 2: Rewrite (cosec^2(theta) - 1) using 1 + cot^2(theta) = cosec^2(theta).", "expected_math": "cot(theta)^2", "expected_latex": "\\csc^2(\\theta) - 1 = \\cot^2(\\theta)", "hints": {"high": "1 + cot^2(theta) = cosec^2(theta) implies cosec^2(theta) - 1 = cot^2(theta).", "mid": "Isolate cot^2(theta) from the identity 1 + cot^2(theta) = cosec^2(theta).", "low": "What is cosec^2(theta) - 1?"}, "quick_options": ["cot(theta)^2", "tan(theta)^2", "cos(theta)^2", "1"]}, {"step_index": 2, "prompt": "Step 3: Multiply tan^2(theta) * cot^2(theta).", "expected_math": "1", "expected_latex": "\\tan^2(\\theta) \\cdot \\frac{1}{\\tan^2(\\theta)} = 1", "hints": {"high": "Since cot(theta) = 1/tan(theta), tan^2(theta) * cot^2(theta) = 1.", "mid": "Recall that tan and cot are reciprocals.", "low": "Evaluate tan^2(theta) * (1/tan^2(theta))."}, "quick_options": ["1", "tan(theta)", "cot(theta)", "0"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-108', 'Complex Trigonometric Proofs & Simplifications', 'Trigonometric Identities', 4.5, 'Multi-step algebraic proofs combining algebraic expansions and trigonometric identities.', '(a+b)^2 = a^2 + 2ab + b^2 | 1/(1+cos(theta)) rationalization', '{"problem_id": "p108_1", "context": "Simplify LHS: sin(theta)/(1 + cos(theta)) + (1 + cos(theta))/sin(theta).", "initial_state": "\\frac{\\sin(\\theta)}{1 + \\cos(\\theta)} + \\frac{1 + \\cos(\\theta)}{\\sin(\\theta)}", "steps": [{"step_index": 0, "prompt": "Step 1: Cross-multiply numerators: sin^2(theta) + (1 + cos(theta))^2. Expand and simplify using sin^2(theta) + cos^2(theta) = 1.", "expected_math": "2 + 2*cos(theta)", "expected_latex": "\\sin^2(\\theta) + 1 + 2\\cos(\\theta) + \\cos^2(\\theta) = 2 + 2\\cos(\\theta)", "hints": {"high": "sin^2(theta) + (1 + 2cos(theta) + cos^2(theta)) = (sin^2(theta) + cos^2(theta)) + 1 + 2cos(theta) = 1 + 1 + 2cos(theta) = 2 + 2cos(theta).", "mid": "Expand (1+cos(theta))^2 and use sin^2(theta) + cos^2(theta) = 1.", "low": "Simplify the expanded numerator 1 + 1 + 2cos(theta)."}, "quick_options": ["2 + 2*cos(theta)", "2*(1+cos(theta))", "2", "sin(theta) + cos(theta)"]}, {"step_index": 1, "prompt": "Step 2: Factoring numerator as 2(1 + cos(theta)) over denominator sin(theta)(1 + cos(theta)), cancel common factors.", "expected_math": "2*cosec(theta)", "expected_latex": "\\frac{2(1 + \\cos(\\theta))}{\\sin(\\theta)(1 + \\cos(\\theta))} = \\frac{2}{\\sin(\\theta)} = 2\\csc(\\theta)", "hints": {"high": "2(1+cos(theta)) / [sin(theta)(1+cos(theta))] = 2 / sin(theta) = 2*cosec(theta).", "mid": "Cancel (1+cos(theta)) and express 2/sin(theta) using cosecant.", "low": "Rewrite 2/sin(theta) as 2*cosec(theta)."}, "quick_options": ["2*cosec(theta)", "2/sin(theta)", "2*sec(theta)", "2*sin(theta)"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-109', 'Applications: Angles of Elevation & Depression', 'Some Applications of Trigonometry', 3.5, 'Solve single-triangle real-world heights and distances problems using tan, sin, and cos.', 'tan(theta) = Height / Distance | Elevation: upward from horizontal', '{"problem_id": "p109_1", "context": "A tower stands vertically on level ground. From a point 15 m away from the foot, the angle of elevation of the top is 60 deg.", "initial_state": "\\text{Distance } d = 15\\text{ m}, \\text{Angle } \\theta = 60^\\circ, \\tan(60^\\circ) = \\frac{h}{15}", "steps": [{"step_index": 0, "prompt": "Step 1: State the exact value of tan(60 deg).", "expected_math": "sqrt(3)", "expected_latex": "\\tan(60^\\circ) = \\sqrt{3}", "hints": {"high": "The exact standard ratio for tan(60 deg) is sqrt(3).", "mid": "Recall the standard angle ratio: tan(60 deg) = sin(60 deg)/cos(60 deg) = sqrt(3).", "low": "What is tan(60 deg)?"}, "quick_options": ["sqrt(3)", "1/sqrt(3)", "1", "sqrt(3)/2"]}, {"step_index": 1, "prompt": "Step 2: Using tan(60 deg) = h / 15, solve for the height of the tower h.", "expected_math": "15*sqrt(3)", "expected_latex": "h = 15\\sqrt{3}\\text{ m}", "hints": {"high": "Multiply both sides by 15: h = 15 * tan(60 deg) = 15 * sqrt(3).", "mid": "h = 15 * sqrt(3).", "low": "Solve h = 15 * tan(60 deg)."}, "quick_options": ["15*sqrt(3)", "15/sqrt(3)", "30", "15"]}]}');
INSERT INTO public.trig_concepts VALUES ('trig-110', 'Advanced Multi-Triangle Heights & Distances Problems', 'Some Applications of Trigonometry', 4.8, 'Multi-triangle geometric problem solving combining angles of elevation and depression.', 'tan(theta1) = h1/d | tan(theta2) = h2/d | Total Height = h1 + h2', '{"problem_id": "p110_1", "context": "From the top of a 7 m high building, the angle of elevation of the top of a cable tower is 60 deg and the angle of depression of its foot is 45 deg.", "initial_state": "\\text{Building height } = 7\\text{ m}, \\text{Depression } = 45^\\circ, \\text{Elevation } = 60^\\circ", "steps": [{"step_index": 0, "prompt": "Step 1: From the depression angle: tan(45 deg) = 7 / d. Find the horizontal distance d between building and tower.", "expected_math": "7", "expected_latex": "d = \\frac{7}{\\tan(45^\\circ)} = 7\\text{ m}", "hints": {"high": "Since tan(45 deg) = 1, d = 7 / 1 = 7 m.", "mid": "Substitute tan(45 deg) = 1 into d = 7 / tan(45 deg).", "low": "What is 7 / 1?"}, "quick_options": ["7", "7*sqrt(3)", "14", "1"]}, {"step_index": 1, "prompt": "Step 2: Let the height of the tower above the building level be h_top. Using tan(60 deg) = h_top / 7, find h_top.", "expected_math": "7*sqrt(3)", "expected_latex": "h_{\\text{top}} = 7\\tan(60^\\circ) = 7\\sqrt{3}\\text{ m}", "hints": {"high": "h_top = d * tan(60 deg) = 7 * sqrt(3).", "mid": "Multiply distance 7 by tan(60 deg) = sqrt(3).", "low": "Compute 7 * sqrt(3)."}, "quick_options": ["7*sqrt(3)", "7/sqrt(3)", "21", "14"]}, {"step_index": 2, "prompt": "Step 3: Calculate the total height of the tower H = 7 + h_top.", "expected_math": "7*(1 + sqrt(3))", "expected_latex": "H = 7 + 7\\sqrt{3} = 7(1 + \\sqrt{3})\\text{ m}", "hints": {"high": "Total height H = 7 + 7*sqrt(3) = 7*(1 + sqrt(3)).", "mid": "Add the building height (7) to the upper tower section (7*sqrt(3)).", "low": "Factor 7 from (7 + 7*sqrt(3))."}, "quick_options": ["7*(1 + sqrt(3))", "7 + 7*sqrt(3)", "14*sqrt(3)", "7*sqrt(3)"]}]}');


--
-- Data for Name: trig_interaction_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: trig_prerequisites; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trig_prerequisites VALUES ('trig-105', 'trig-102');
INSERT INTO public.trig_prerequisites VALUES ('trig-105', 'trig-103');
INSERT INTO public.trig_prerequisites VALUES ('trig-109', 'trig-102');
INSERT INTO public.trig_prerequisites VALUES ('trig-109', 'trig-105');
INSERT INTO public.trig_prerequisites VALUES ('trig-106', 'trig-102');
INSERT INTO public.trig_prerequisites VALUES ('trig-106', 'trig-104');
INSERT INTO public.trig_prerequisites VALUES ('trig-102', 'trig-101');
INSERT INTO public.trig_prerequisites VALUES ('trig-110', 'trig-109');
INSERT INTO public.trig_prerequisites VALUES ('trig-103', 'trig-102');
INSERT INTO public.trig_prerequisites VALUES ('trig-107', 'trig-106');
INSERT INTO public.trig_prerequisites VALUES ('trig-104', 'trig-102');
INSERT INTO public.trig_prerequisites VALUES ('trig-104', 'trig-103');
INSERT INTO public.trig_prerequisites VALUES ('trig-108', 'trig-104');
INSERT INTO public.trig_prerequisites VALUES ('trig-108', 'trig-107');


--
-- Data for Name: trig_student_states; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trig_student_states VALUES (1, 'device:756c5925-8376-4dd4-b613-c70b80faf283', 'trig-101', 0, 0, 1, 0, '{"accuracy_rate": 0.0, "avg_response_latency_sec": 0.0, "total_attempts": 0, "strengths": [], "struggles": []}', '2026-09-11 07:29:35.802258');
INSERT INTO public.trig_student_states VALUES (2, 'device:49510500-d462-4b49-b257-3a12897a6031', 'trig-101', 0, 0, 1, 0, '{"accuracy_rate": 0.0, "avg_response_latency_sec": 0.0, "total_attempts": 0, "strengths": [], "struggles": []}', '2026-09-11 07:44:11.848221');
INSERT INTO public.trig_student_states VALUES (3, 'device:72d9a49a-53b9-4588-be95-30f29fb350f4', 'trig-101', 0, 0, 1, 0, '{"accuracy_rate": 0.0, "avg_response_latency_sec": 0.0, "total_attempts": 0, "strengths": [], "struggles": []}', '2026-09-11 07:45:24.109393');
INSERT INTO public.trig_student_states VALUES (4, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 0, 1, 0, '{"accuracy_rate": 0.0, "avg_response_latency_sec": 0.0, "total_attempts": 0, "strengths": [], "struggles": []}', '2026-09-11 07:53:36.320555');


--
-- Data for Name: trig_telemetry_events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trig_telemetry_events VALUES (1, 'device:49510500-d462-4b49-b257-3a12897a6031', 'trig-101', 0, 'next_problem_click', '{"concept_id": "trig-101"}', '2026-09-11 07:44:11.842706');
INSERT INTO public.trig_telemetry_events VALUES (2, 'device:49510500-d462-4b49-b257-3a12897a6031', 'trig-101', 0, 'next_problem_click', '{"concept_id": "trig-101"}', '2026-09-11 07:44:14.015869');
INSERT INTO public.trig_telemetry_events VALUES (3, 'device:72d9a49a-53b9-4588-be95-30f29fb350f4', 'trig-101', 0, 'next_problem_click', '{"concept_id": "trig-101"}', '2026-09-11 07:45:24.107395');
INSERT INTO public.trig_telemetry_events VALUES (4, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'next_problem_click', '{"concept_id": "trig-101"}', '2026-09-11 07:53:36.311556');
INSERT INTO public.trig_telemetry_events VALUES (5, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'paste_normalized', '{"cleaned_length": 11}', '2026-09-11 07:55:24.124646');
INSERT INTO public.trig_telemetry_events VALUES (6, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'paste_normalized', '{"cleaned_length": 10}', '2026-09-11 07:56:27.199922');
INSERT INTO public.trig_telemetry_events VALUES (7, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'paste_normalized', '{"cleaned_length": 10}', '2026-09-11 07:57:00.322979');
INSERT INTO public.trig_telemetry_events VALUES (8, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_toggle', '{"isOpen": true}', '2026-09-11 07:57:10.385926');
INSERT INTO public.trig_telemetry_events VALUES (9, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 07:57:17.350538');
INSERT INTO public.trig_telemetry_events VALUES (10, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 07:57:36.937514');
INSERT INTO public.trig_telemetry_events VALUES (11, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "\u00f7", "token": " \u00f7 ", "category": "algebra"}', '2026-09-11 07:57:40.061275');
INSERT INTO public.trig_telemetry_events VALUES (12, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "+", "token": " + ", "category": "algebra"}', '2026-09-11 07:57:44.882602');
INSERT INTO public.trig_telemetry_events VALUES (13, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 07:57:49.611475');
INSERT INTO public.trig_telemetry_events VALUES (14, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "\u221ax", "token": "__SQRT__", "category": "algebra"}', '2026-09-11 07:58:06.748516');
INSERT INTO public.trig_telemetry_events VALUES (15, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'next_problem_click', '{"concept_id": "trig-101"}', '2026-09-11 07:59:25.935715');
INSERT INTO public.trig_telemetry_events VALUES (16, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_toggle', '{"isOpen": true}', '2026-09-11 08:00:50.514049');
INSERT INTO public.trig_telemetry_events VALUES (17, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 08:00:52.703878');
INSERT INTO public.trig_telemetry_events VALUES (18, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 08:01:03.117955');
INSERT INTO public.trig_telemetry_events VALUES (19, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 08:01:07.982058');
INSERT INTO public.trig_telemetry_events VALUES (20, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_toggle', '{"isOpen": true}', '2026-09-11 12:58:17.338736');
INSERT INTO public.trig_telemetry_events VALUES (21, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 12:58:24.548235');
INSERT INTO public.trig_telemetry_events VALUES (22, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 12:58:37.290147');
INSERT INTO public.trig_telemetry_events VALUES (23, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 12:58:41.681152');
INSERT INTO public.trig_telemetry_events VALUES (24, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 12:59:12.397857');
INSERT INTO public.trig_telemetry_events VALUES (25, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 12:59:15.690415');
INSERT INTO public.trig_telemetry_events VALUES (26, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'paste_normalized', '{"cleaned_length": 7}', '2026-09-11 13:00:24.029287');
INSERT INTO public.trig_telemetry_events VALUES (27, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "\u221ax", "token": "__SQRT__", "category": "algebra"}', '2026-09-11 13:01:00.624253');
INSERT INTO public.trig_telemetry_events VALUES (28, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "\u221ax", "token": "__SQRT__", "category": "algebra"}', '2026-09-11 13:01:05.930769');
INSERT INTO public.trig_telemetry_events VALUES (29, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_toggle', '{"isOpen": false}', '2026-09-11 13:01:40.228206');
INSERT INTO public.trig_telemetry_events VALUES (30, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_toggle', '{"isOpen": true}', '2026-09-11 13:14:16.984691');
INSERT INTO public.trig_telemetry_events VALUES (31, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 13:14:19.864151');
INSERT INTO public.trig_telemetry_events VALUES (32, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 13:14:41.042932');
INSERT INTO public.trig_telemetry_events VALUES (33, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 13:14:44.746872');
INSERT INTO public.trig_telemetry_events VALUES (34, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 1, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 13:15:26.881622');
INSERT INTO public.trig_telemetry_events VALUES (35, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 1, 'calculator_button_click', '{"label": "x\u00b3", "token": "\u00b3", "category": "algebra"}', '2026-09-11 13:15:32.291328');
INSERT INTO public.trig_telemetry_events VALUES (36, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 1, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 13:15:39.279358');
INSERT INTO public.trig_telemetry_events VALUES (37, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 1, 'quick_option_click', '{"option": "AC^2 = 3^2 + 4^2"}', '2026-09-11 13:16:10.592788');
INSERT INTO public.trig_telemetry_events VALUES (38, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 3, 'calculator_button_click', '{"label": "x\u00b2", "token": "\u00b2", "category": "algebra"}', '2026-09-11 13:16:54.069978');
INSERT INTO public.trig_telemetry_events VALUES (39, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 3, 'calculator_button_click', '{"label": "\u221ax", "token": "__SQRT__", "category": "algebra"}', '2026-09-11 13:17:02.550415');
INSERT INTO public.trig_telemetry_events VALUES (40, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 5, 'calculator_toggle', '{"isOpen": false}', '2026-09-11 13:31:52.960733');
INSERT INTO public.trig_telemetry_events VALUES (41, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 5, 'hint_toggle', '{"isOpen": true}', '2026-09-11 13:32:59.552073');
INSERT INTO public.trig_telemetry_events VALUES (42, 'device:5cae7265-58f3-429b-9ae9-4c155b9dab55', 'trig-101', 0, 'next_problem_click', '{"concept_id": "trig-101"}', '2026-09-11 15:15:55.711628');


--
-- Data for Name: user_tenant_mappings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_tenant_mappings VALUES ('645c9012-06ae-4ab6-b614-31a451c51e16', 'd663e0b3-d4dd-4255-b515-4162409ab9a1', '6f9f8831-a04c-430a-879f-114c4a55c7d4', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('05da4454-65e2-43a6-9903-566426532838', '737231f7-d5fe-424c-aff7-ce491100dea4', '499eff2a-78ca-42d2-97dd-6abcdf187638', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('2156f492-93b2-4667-8374-44e237dd812b', '0a9b2508-7952-4a9f-ba67-63f90d4144c7', '6a1c22c0-d426-4ba0-927b-b6fe56783ef0', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('19b94a44-21bb-4409-9d69-48d9a76bdf38', '6c721ff8-4c8a-4ba8-9254-e693cb8947f9', '6f9f8831-a04c-430a-879f-114c4a55c7d4', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('e28fa962-964a-4587-92ea-350af5a3926f', '6c721ff8-4c8a-4ba8-9254-e693cb8947f9', '499eff2a-78ca-42d2-97dd-6abcdf187638', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('47785a0f-438a-49f0-a407-f57d4b21cf0f', '3f1233f9-1151-41f8-8039-aadd22458347', '6a1c22c0-d426-4ba0-927b-b6fe56783ef0', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('813f2f8d-b62d-49e7-8a93-18f8f4780620', '4067a40f-8539-41f9-862c-571c6ce2960c', 'aa9f9892-ca30-4b9f-9964-dd4db941d887', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('73533cf5-5936-442d-9aa1-40c2a2210a04', 'bcd51107-f970-4a5e-a0ae-f40c9806ba8e', '6a1c22c0-d426-4ba0-927b-b6fe56783ef0', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('580b5643-276c-4154-9924-4e51c76c8553', '6471ed38-1245-472c-8623-04c87daf34c0', '6f9f8831-a04c-430a-879f-114c4a55c7d4', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('90b901b2-0e17-4bea-ba5c-65a2e1978bac', '1500cc7c-68ed-48fe-a99b-1e41ef87f6ff', 'd0d5aa50-bc2a-4f2c-b392-811bab9c3707', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('33b753f7-5b0e-4dee-82e2-13d9f89e29cb', 'd86988fc-d805-4ac6-a546-f2aedc1dd77a', '93d9427a-25e7-4a19-a54e-90024e095b25', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('d9b94051-9c5f-4d7a-8a69-7117b1a66cae', '78304df8-ef89-4444-981a-4095ce8395aa', 'ab814925-3fd3-422d-bd56-5155eb88450b', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('00cddf99-a67e-4942-9847-87de78d2e929', '1417c297-2dac-4900-a51c-0d5f3fdbd0fe', '2673eeba-e9c5-43c7-873d-2d41c3044482', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('e433330c-fb33-4493-9c42-e3e2b0b81fd1', 'b7a1747d-0bf3-4980-a0f6-cd88e9e063c2', '2673eeba-e9c5-43c7-873d-2d41c3044482', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('458bf9ee-e219-4407-9916-ddc0f5ad1d1f', '9715e610-e346-4d4f-8574-31b42ee768fd', 'bd1373a1-d8e3-443a-8a94-2c6efcea48cc', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('4713be94-2bc0-43e6-84ff-d989cebfe970', 'f8a5bc60-85ce-47fc-8ef1-d453ecb9ed74', 'b3509d8a-be46-40c4-a688-3c74b27eb6af', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('2e5b710d-2508-467d-a478-a021f98be7b0', '07e9622f-7ede-43d3-b0ba-e174b2e13b96', '8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('9bb03eae-7a1b-4459-a4d1-13ed76d15374', 'f54b2940-b1bf-4f2d-9e04-5205b642041e', '8cb4a12b-daf4-4ee3-a6ff-3bd0d9af1109', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('af47a62a-e59e-4c84-ad43-c3f8c4f8b070', 'dd826311-5b1c-403f-8f8f-25f594d6f0be', '847b1395-302b-4739-9933-567244797927', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('764ad6cf-a8aa-47be-bb33-2952fa37782e', '1fcbaebd-89b9-4c10-850e-47ce22f64da2', '4895c1b0-362c-4ec9-9f71-151dab3a3a1d', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('ef3d2b8e-697b-48a9-b37d-d688d8a6943b', '0c5c5bb8-48f0-441b-acda-451700fc3249', 'cc18849d-5fe6-496b-bf04-ce1c19e5146d', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('08a0dbee-1c76-4677-a162-02b5fba5f73e', 'c266db48-3433-4489-8798-976aeb851ac0', 'cb6f6053-d291-4951-a392-508419a764e9', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('29d31d91-3500-4ec7-8544-44d5e45a5dce', 'a28d4417-9570-4a05-9d2a-89e2c4f0dfe4', 'b5da2358-4cfa-49cc-9963-e18c50aa73ff', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('c083d4c2-f6ea-4d7c-9e89-d27f4184dc7b', 'e0d86ab1-4ba3-440c-ac49-e64868f9ef70', 'a7da8631-1a6e-4f68-b34d-528d53718c1a', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('171d93b3-a73b-4921-b58e-87883e3699b0', '2152e5b9-2ab0-4a3e-989e-6743d0ee5869', 'b9bd6bed-fe4d-4919-8e33-e4d9119f1105', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('2b441b90-6ed2-4b15-9d64-0c2ac710ca5e', '05c6d79a-6855-4db8-b1f6-822ea52980d0', '33cde123-5dc4-406c-80cf-902c10a30130', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('0e344aee-c2a3-440c-aa3c-3ff35ce83297', '4aed1f9a-34f0-4f7a-80a0-5ab7ef05a03a', '457f9d5b-dd87-4d29-be1f-6188757bb332', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('5710d0a0-91bc-4603-a981-89964781d2b1', '5e5b9a6a-30de-43ee-9570-68227cc5fd6d', '9247d818-b236-447e-8c1c-e82c78b2b3a7', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('dffa2ec3-ccfe-460c-81c1-36900651e8de', '962021d6-227f-4f14-aabb-37d83c94a858', '9247d818-b236-447e-8c1c-e82c78b2b3a7', 'STUDENT', '0fcf0833-a56c-4b40-9a44-6ee4a0f869d9');
INSERT INTO public.user_tenant_mappings VALUES ('6f8c008e-99b2-414f-92f3-499e13b4b63f', '3927a570-c9ad-45a2-a6e7-0223523500cc', '9247d818-b236-447e-8c1c-e82c78b2b3a7', 'STUDENT', '0fcf0833-a56c-4b40-9a44-6ee4a0f869d9');
INSERT INTO public.user_tenant_mappings VALUES ('e9896d7b-e24e-4a5d-afd3-52b76d4877fd', 'bdfe5470-6886-49c0-b3d1-6bf1ed957324', '9247d818-b236-447e-8c1c-e82c78b2b3a7', 'STUDENT', '0fcf0833-a56c-4b40-9a44-6ee4a0f869d9');
INSERT INTO public.user_tenant_mappings VALUES ('08d1570f-c5d5-4fa9-865d-cf9aa821fdd6', 'e619147c-3036-481b-84b1-6ccb4ad56d2f', '5f0d4f7d-f9b7-4327-876b-4cbf33a03c0b', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('ce9a349b-ed10-41e2-9c42-5d03e9c7ef5e', '1ceb0e6f-ea80-44a7-8b32-08529666e41e', '7c48313d-283c-4ca4-a570-40b08c3e487d', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('53c0cd64-b53a-4f54-88ac-57f82d1bf691', 'b53cc3c4-aa87-49d3-993d-3013f37fdd81', '02a7455f-ea42-4cab-a763-19f9d770fd22', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('391e809f-1d52-4232-96b0-eb80bbf52292', '90209412-6229-4dbc-8f2a-2ee045ede29c', 'd17cc3c6-bd16-43c0-99f0-545014152204', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('676019bd-21ad-43f5-b493-276559f66abe', 'b8b8b80c-6e05-4db3-8921-535db31b9f94', 'c0da6d4b-b166-4cc5-9fe2-10f7e40e711a', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('7e957310-e04b-48b0-ad42-653111292e81', '2c01ca9e-e3fd-4c4e-a84c-102524fc4ff4', '7e898ce1-3740-4b8a-a9f2-3a4ed091a692', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('b8d3fed6-ae55-419b-93c1-765cc8123529', '8aa94f2f-7a68-4b71-bb1c-90bea7564fe0', '556c95a7-093f-4057-b6ac-bd9c9c70425f', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('585218c7-6f5d-4951-acc0-be9c91af260b', '52f91c72-dfce-4022-998f-4227c9fb3463', '63d714b6-1251-421f-8628-cc7c2b1756ae', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('01e8dd49-4eed-450a-8593-0b1becd420aa', '3d4400f5-0641-4888-922d-491bef7758cb', '63d714b6-1251-421f-8628-cc7c2b1756ae', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('a83ffa2f-bc90-428c-bb35-1c0f54a0e31b', '188982ab-374c-46bd-9b0f-d051c514423f', '556c95a7-093f-4057-b6ac-bd9c9c70425f', 'STUDENT', 'e9ee3bbe-e2fe-4a10-951a-1030d068fc0e');
INSERT INTO public.user_tenant_mappings VALUES ('c8411d2b-f8a0-45ef-8341-881987253bfd', 'c2461edd-cb76-415d-b9e5-987b582cab75', '6f9f8831-a04c-430a-879f-114c4a55c7d4', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('ec7b4583-ad17-4748-bf04-91445880aa73', 'e3cce8ff-2595-4e75-9cb6-230e87b2a074', '0822f950-b21f-457a-b9fa-5364d0ae4796', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('dd62caa6-5dfe-4692-85d8-dabebf01b697', 'b9b9bed9-efe6-4718-98c9-2ff5a2fae2d0', '0822f950-b21f-457a-b9fa-5364d0ae4796', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('a5c76485-4298-4066-9447-5baa377befa9', 'ec1d0373-a245-461e-a799-8948bfed77c0', '747b5045-38a0-4257-a261-615d42e3fd78', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('5c531011-f902-416f-ba09-9659e8f5d011', 'a0bb983e-80a8-485d-b762-442c34ea512a', '2aa16fee-89de-48f8-b0fb-cdfc4b433bcf', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('ce9c698d-1049-4eaf-9613-2e8bf40a0b4b', '600e206a-0f71-44a7-9d54-63d1c18a7a6b', '79b61565-27e9-480f-80a4-19863777f3a2', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('e707dea3-1d83-4d1e-a86d-f5e7796980c9', 'f81844ed-cffa-4292-97b9-aaff48c66ded', 'eeaa33bd-f609-46ed-b2c5-8d30e61003b4', 'STUDENT', '52f96661-2cbf-423a-ace1-30e8c11a8357');
INSERT INTO public.user_tenant_mappings VALUES ('e8f9fe68-b3c4-4917-a899-9487ca44cd5d', '468b9bb4-1f9e-4fbb-a93a-017f647f4724', 'eeaa33bd-f609-46ed-b2c5-8d30e61003b4', 'STUDENT', '355ae393-2972-4526-be94-6c51c9075b63');
INSERT INTO public.user_tenant_mappings VALUES ('cd5db180-a1ea-4d76-bf9f-0ca2179e7f39', '2f9cf096-0f62-41b9-84c4-815cded2deed', 'eeaa33bd-f609-46ed-b2c5-8d30e61003b4', 'STUDENT', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('a75884da-5e27-404f-a138-1d91974351a7', '9ab973da-bb14-4947-8d14-baa289dc17e7', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('8e15fc82-0198-4d08-add7-8d8bab3f831f', '3b5a785a-dde8-4854-b1e1-d3858540358a', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'STUDENT', 'ac3ca89a-7090-4639-8038-b7163ec572b2');
INSERT INTO public.user_tenant_mappings VALUES ('f55d65c7-311a-444d-9daa-dda9876a55f0', '0719090b-783a-4fe1-9125-aaa0ebcbb5cc', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'STUDENT', 'ac3ca89a-7090-4639-8038-b7163ec572b2');
INSERT INTO public.user_tenant_mappings VALUES ('74a736c5-d2bc-4635-8803-e057ac943634', '0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'STUDENT', 'ac3ca89a-7090-4639-8038-b7163ec572b2');
INSERT INTO public.user_tenant_mappings VALUES ('99e13813-0f7f-4113-81b7-5dbad1e1bc6c', '75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'STUDENT', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d');
INSERT INTO public.user_tenant_mappings VALUES ('dc76718f-dc16-464e-aaa6-4fc5a98453d8', 'e32bbc08-2634-451a-9656-872b019f6462', 'e75291f5-7558-4d40-aa97-9e7a94cacf7f', 'STUDENT', 'd19af03c-9aa4-48b0-9b3d-699cdafb732d');
INSERT INTO public.user_tenant_mappings VALUES ('1db753d5-243a-4c6a-8e9c-1c526ad7d525', '1d009a60-440b-458b-90cd-7a22f617f842', '20d3a1c5-c67a-4f70-a5d7-978e200fcde5', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('6f1a65a6-37bc-4d88-8d2f-55eeb1f173c5', '47163336-6603-49a4-87db-1282de388df8', '670c6539-af8d-4c92-ba11-70cc321dd0b7', 'TEACHER', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('c1cd00a7-0d22-4e83-be62-3bcad775641b', '4067a40f-8539-41f9-862c-571c6ce2960c', '4c49d0fd-ac30-40a2-8119-e5888e141a93', 'ADMIN', NULL);
INSERT INTO public.user_tenant_mappings VALUES ('1548ec25-f744-44a9-9c57-520ee708d34a', '90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', '76702573-3bbe-4f30-b55e-0aa08213ae2d', 'ADMIN', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('0c5c5bb8-48f0-441b-acda-451700fc3249', 'smoke-b27ab875@example.com', '$2b$12$W22hWVAQBRoaSJBWNBqmG.mEQubnbyfbJjkAivjw3OEdFSaPaiHQC', '2026-08-19 09:04:52.095584+05:30', 'Smoke');
INSERT INTO public.users VALUES ('3f1233f9-1151-41f8-8039-aadd22458347', 'bob@tc3.dev', '$2b$12$UaR6CzKHosZUwEYMrQaF7O5mu9ZqAl4JvhGcmkrh9gm.eqFzy/z9q', '2026-08-11 16:06:12.295844+05:30', 'Bob');
INSERT INTO public.users VALUES ('90e7b4eb-9ffa-49f3-8b08-93c4685c26e5', 'admin@springfield.dev', '$2b$12$UaR6CzKHosZUwEYMrQaF7O5mu9ZqAl4JvhGcmkrh9gm.eqFzy/z9q', '2026-08-11 17:23:56.389241+05:30', 'Springfield Admin');
INSERT INTO public.users VALUES ('9715e610-e346-4d4f-8574-31b42ee768fd', 'practicechapterstest.student@test.dev', '$2b$12$zTxJXm/r6JFbRmcmldvNt.ncD2koZ6EZe/LBlAw1WzJ9oCzwL0m9.', '2026-08-30 04:10:27.079588+05:30', 'PC Student');
INSERT INTO public.users VALUES ('6c721ff8-4c8a-4ba8-9254-e693cb8947f9', 'alice@springfield.dev', '$2b$12$UaR6CzKHosZUwEYMrQaF7O5mu9ZqAl4JvhGcmkrh9gm.eqFzy/z9q', '2026-08-11 08:09:35.259929+05:30', 'Alice');
INSERT INTO public.users VALUES ('c266db48-3433-4489-8798-976aeb851ac0', 'smoke-0ceb678c@example.com', '$2b$12$BsEUnZ.NhItqWQIRIWqiY.ZoPuZy9nAWSreh5yNEwZeaom7NQidWa', '2026-08-19 12:13:22.338394+05:30', 'Smoke');
INSERT INTO public.users VALUES ('a28d4417-9570-4a05-9d2a-89e2c4f0dfe4', 'practicegentest.quiz@test.dev', '$2b$12$t0GtVc3XWR5lP6UpBIIrn.FKcQr/tT6XhjlQ2GW/nC8KuCSHF5QAC', '2026-08-30 04:10:38.106357+05:30', 'PracticeGenTest Quiz Tenant');
INSERT INTO public.users VALUES ('e0d86ab1-4ba3-440c-ac49-e64868f9ef70', 'practicegentest.noquiz@test.dev', '$2b$12$t0GtVc3XWR5lP6UpBIIrn.FKcQr/tT6XhjlQ2GW/nC8KuCSHF5QAC', '2026-08-30 04:10:38.110013+05:30', 'PracticeGenTest NoQuiz Tenant');
INSERT INTO public.users VALUES ('05c6d79a-6855-4db8-b1f6-822ea52980d0', 'richtexttest.student@test.dev', '$2b$12$jWRpe0fkZMP.gDMp/HZ1iOtf4BPypUEc/aBNcqPHuSrz7quJzz6MO', '2026-08-30 04:11:08.58284+05:30', 'RichText Student');
INSERT INTO public.users VALUES ('5e5b9a6a-30de-43ee-9570-68227cc5fd6d', 'rostersizetest.teacher@test.dev', '$2b$12$krmtOPyQX7z8kJsAF3fau.HOddYl644Z8tHHybJjkMDFsKUr7GJb.', '2026-08-30 04:11:30.133003+05:30', 'RS Teacher');
INSERT INTO public.users VALUES ('ec1d0373-a245-461e-a799-8948bfed77c0', 'studentprofiletest.teacher@test.dev', '$2b$12$l5Bk9vPGWRTGOM4UoCQCGOU.UeKUC0JwCAGRaoiCAL5TKoRCWeO1O', '2026-08-30 04:12:13.502698+05:30', 'L3 Teacher');
INSERT INTO public.users VALUES ('b8b8b80c-6e05-4db3-8921-535db31b9f94', 'sectionsendpointtest.teacher@test.dev', '$2b$12$/u8/WQ58s8sjAt6loyudcejXJu9gRevA0Gq77Aq0HYVuZ5LdUSgdm', '2026-08-30 04:11:44.460901+05:30', 'SE Teacher');
INSERT INTO public.users VALUES ('2c01ca9e-e3fd-4c4e-a84c-102524fc4ff4', 'sectionsendpointtest.other-teacher@test.dev', '$2b$12$SZCQHHv5lalMWDz5ufyOMO2FyTw61bD8bNXogPTmDY2e8sl5f2WHq', '2026-08-30 04:11:44.657172+05:30', 'SE Teacher');
INSERT INTO public.users VALUES ('600e206a-0f71-44a7-9d54-63d1c18a7a6b', 'suggestednextstepstest.teacher@test.dev', '$2b$12$E6AUF.sNOPJbxh74QoSqq.EPWkjftzzuea4d5NITpEfWNcsC1e6ua', '2026-08-30 04:12:20.21783+05:30', 'NS Teacher');
INSERT INTO public.users VALUES ('0a9b2508-7952-4a9f-ba67-63f90d4144c7', 'tc3.student@test.dev', '$2b$12$WVd.d3cqjTxikXy.NOuRA.tzrk3loDiGmDyzEKhEb1H/7199BDsc6', '2026-08-10 22:10:05.446329+05:30', 'tc3.student');
INSERT INTO public.users VALUES ('c2461edd-cb76-415d-b9e5-987b582cab75', 'sec.bcrypt@test.dev', '$2b$12$/XO7u6F7t3joRsQWE88gEuATjiM6JMJTIe/a2wmZ7/.Y3ec/RC6Ui', '2026-08-30 04:11:58.165086+05:30', 'Sec Test');
INSERT INTO public.users VALUES ('9ab973da-bb14-4947-8d14-baa289dc17e7', 'demo.teacher@greenwood.dev', '$2b$12$eDjGS2ILTYRS2Cq1xqdRGuWawi8rltl5I9l7UFgNrunDhwVoiRmNy', '2026-08-28 13:08:17.821127+05:30', 'Demo Teacher');
INSERT INTO public.users VALUES ('e619147c-3036-481b-84b1-6ccb4ad56d2f', 'smoke-27d04bb4@example.com', '$2b$12$gwu0bnlKwSVnwQmREeTHmOpV2pKuo87J.7moqs2Ke4huZvRwBh9Ji', '2026-08-24 16:59:22.58923+05:30', 'Smoke');
INSERT INTO public.users VALUES ('1ceb0e6f-ea80-44a7-8b32-08529666e41e', 'tier3-e3e4c7c5@example.com', '$2b$12$XcdbFhZFWDA8Mcf30zmES.CfxMG3/SRAPB3K8.onv9AC1j9hdR.S.', '2026-08-24 17:00:33.913255+05:30', 'Springfield Science Academy');
INSERT INTO public.users VALUES ('737231f7-d5fe-424c-aff7-ce491100dea4', 'tc2.student@test.dev', '$2b$12$TVe3TaAM6VTGvc7RCT0PqeSRNraBsgFhzakDg1oDIbxjRneGzSQ4i', '2026-08-10 22:10:05.446329+05:30', 'tc2.student');
INSERT INTO public.users VALUES ('b53cc3c4-aa87-49d3-993d-3013f37fdd81', 'tier4-54fdca53@example.com', '$2b$12$n0ZqZwuOrmwWpco30BceTu5lZfA81VSRdjzG9jAe.ryzgmcIADYI2', '2026-08-24 17:00:34.410226+05:30', 'Westfield Co-Teacher Model School');
INSERT INTO public.users VALUES ('bcd51107-f970-4a5e-a0ae-f40c9806ba8e', 'teacher@tc3school.dev', '$2b$12$TVe3TaAM6VTGvc7RCT0PqeSRNraBsgFhzakDg1oDIbxjRneGzSQ4i', '2026-08-11 17:52:26.885516+05:30', 'Meera Iyer');
INSERT INTO public.users VALUES ('6471ed38-1245-472c-8623-04c87daf34c0', 'teacher@tc1school.dev', '$2b$12$TVe3TaAM6VTGvc7RCT0PqeSRNraBsgFhzakDg1oDIbxjRneGzSQ4i', '2026-08-11 17:52:26.89331+05:30', 'Rahul Verma');
INSERT INTO public.users VALUES ('1500cc7c-68ed-48fe-a99b-1e41ef87f6ff', 'teacher@expired.dev', '$2b$12$TVe3TaAM6VTGvc7RCT0PqeSRNraBsgFhzakDg1oDIbxjRneGzSQ4i', '2026-08-11 17:52:26.894048+05:30', 'Old School Teacher');
INSERT INTO public.users VALUES ('4067a40f-8539-41f9-862c-571c6ce2960c', 'admin@edova.dev', '$2b$12$TVe3TaAM6VTGvc7RCT0PqeSRNraBsgFhzakDg1oDIbxjRneGzSQ4i', '2026-08-11 17:23:56.384359+05:30', 'Platform Admin');
INSERT INTO public.users VALUES ('d663e0b3-d4dd-4255-b515-4162409ab9a1', 'tc1.student@test.dev', '$2b$12$TVe3TaAM6VTGvc7RCT0PqeSRNraBsgFhzakDg1oDIbxjRneGzSQ4i', '2026-08-10 22:10:05.446329+05:30', 'tc1.student');
INSERT INTO public.users VALUES ('07e9622f-7ede-43d3-b0ba-e174b2e13b96', 'admin@vanividhyasharam.dev', '$2b$12$.xa6bLDRnsQitKkONBZQLewixvxNpzfam97n5idgS.ysEMVW8J8dK', '2026-08-17 14:01:09.338231+05:30', 'Vani Vidhyasharam Admin');
INSERT INTO public.users VALUES ('f54b2940-b1bf-4f2d-9e04-5205b642041e', 'tellsathish@gmail.com', '$2b$12$D/5Fkn8xrhqM3V/60JMRceJjSf6vRccrXNTwb8X0QMNjDYyWTAGxu', '2026-08-17 14:25:41.147885+05:30', 'sathish.pv');
INSERT INTO public.users VALUES ('dd826311-5b1c-403f-8f8f-25f594d6f0be', 'buyer@demo.dev', '$2b$12$eqpaCS8aVIBpey.JedJRJOQXrkSjq5l/PD5c4UqoWL8E9FT.iz2IO', '2026-08-17 19:57:31.374523+05:30', 'Demo Buyer');
INSERT INTO public.users VALUES ('1fcbaebd-89b9-4c10-850e-47ce22f64da2', 'chennai@gmail.com', '$2b$12$jasaCCR5VwmSlaIf2x3d2.comC4EGmmbetfOfriBFyv.XQ.De8AnS', '2026-08-17 20:16:20.940151+05:30', 'Chettinad Vidyashram');
INSERT INTO public.users VALUES ('f81844ed-cffa-4292-97b9-aaff48c66ded', 'testassigntest.studentA@test.dev', '$2b$12$gWZjY4Ki6430j6DUUF9tAeQ0mWaPV7TZirDFrQb//ddDceGbIW/zq', '2026-08-29 08:10:16.93909+05:30', 'Student A');
INSERT INTO public.users VALUES ('468b9bb4-1f9e-4fbb-a93a-017f647f4724', 'testassigntest.studentB@test.dev', '$2b$12$gWZjY4Ki6430j6DUUF9tAeQ0mWaPV7TZirDFrQb//ddDceGbIW/zq', '2026-08-29 08:10:16.942338+05:30', 'Student B');
INSERT INTO public.users VALUES ('1d009a60-440b-458b-90cd-7a22f617f842', 'analyticsoverviewtest.teacher@test.dev', '$2b$12$6tjQ87GJUuz7vZlvpGuUW.uSiQEDA1lxwIt/G78//MlFPjvlfJ5sm', '2026-08-30 04:09:04.392772+05:30', 'AO Teacher');
INSERT INTO public.users VALUES ('d86988fc-d805-4ac6-a546-f2aedc1dd77a', 'labexec@edova.dev', '$2b$12$PQf9gQJSs7r77QOc6EXSVumTuYmw9SFwCJOZjf/unhAJfH3lfsDae', '2026-08-30 04:09:37.101586+05:30', 'Lab Exec');
INSERT INTO public.users VALUES ('1417c297-2dac-4900-a51c-0d5f3fdbd0fe', 'p2b-admin@edova.dev', '$2b$12$lDQh2O8zO6YukesyXSuVdeNJ.4W9.29wZI96IMwTPxShZWcLhpfBq', '2026-08-30 04:09:58.265848+05:30', 'P2B School Admin');
INSERT INTO public.users VALUES ('3b5a785a-dde8-4854-b1e1-d3858540358a', 'demo.student0@greenwood.dev', '$2b$12$KuLlvKwnHvWvaKR3esyA2OUqPELi7B.bWeb3nB5DqN2NFsP8Avsde', '2026-08-28 13:08:18.020729+05:30', 'Riya S.');
INSERT INTO public.users VALUES ('0719090b-783a-4fe1-9125-aaa0ebcbb5cc', 'demo.student1@greenwood.dev', '$2b$12$Otte8pQnFKt5SsDzvP9mOe6gWvlco0zWCTpZfrFWq9NOGydp4RwMu', '2026-08-28 13:08:18.21586+05:30', 'Arjun K.');
INSERT INTO public.users VALUES ('0855cad4-a2d3-4d90-85ba-d5b46dff58d7', 'demo.student2@greenwood.dev', '$2b$12$A69jxo24oXTsX/aTV/.IpOS.R8juxIer/x.L6wyDTT/iUIl0LpFsC', '2026-08-28 13:08:18.417455+05:30', 'Meera P.');
INSERT INTO public.users VALUES ('75f24a4e-2e5d-4d86-bef9-82c87c4e34e5', 'demo.student3@greenwood.dev', '$2b$12$2ac/BHpZ3ExgaKUClQcjbObaxhfQXFdKcoIrm0dCv9TvCYCymA5.O', '2026-08-28 13:08:18.616757+05:30', 'Dev V.');
INSERT INTO public.users VALUES ('e32bbc08-2634-451a-9656-872b019f6462', 'demo.student4@greenwood.dev', '$2b$12$CKrumlO1RF0DpOSJ06Do/OrnEQNC5rqfR6rT9KMwqTXDWjqQcuSHK', '2026-08-28 13:08:18.820462+05:30', 'Naveen T.');
INSERT INTO public.users VALUES ('f8a5bc60-85ce-47fc-8ef1-d453ecb9ed74', 'practicechecktest.student@test.dev', '$2b$12$H068SIjUaSPWWMtwD0CsJOhaoQVnD4lXuP7XlYhCccvRCrzPu2beC', '2026-08-30 04:10:32.300714+05:30', 'PCheck Student');
INSERT INTO public.users VALUES ('2152e5b9-2ab0-4a3e-989e-6743d0ee5869', 'treevistest.student@test.dev', '$2b$12$v1MC25hsQhUUFm8by6uk6.lRMb63bifdSZWrE.2l1otZcFBCCT9km', '2026-08-30 04:10:45.797423+05:30', 'TreeVis Student');
INSERT INTO public.users VALUES ('4aed1f9a-34f0-4f7a-80a0-5ab7ef05a03a', 'sectiongradetest.teacher@test.dev', '$2b$12$4UavBZ28F6WGRyouwJjpX.mULf.8wNI6q8ZMNsVJgMlhXd9APzE3e', '2026-08-30 04:11:24.784019+05:30', 'SG Teacher');
INSERT INTO public.users VALUES ('962021d6-227f-4f14-aabb-37d83c94a858', 'rostersizetest.student0@test.dev', '$2b$12$HP07UwFu3TGh2/STSZgWLeks/kTibUCD5dXRZlCiGQUOFLrBETXqu', '2026-08-30 04:11:31.344477+05:30', 'RS Student 0');
INSERT INTO public.users VALUES ('3927a570-c9ad-45a2-a6e7-0223523500cc', 'rostersizetest.student1@test.dev', '$2b$12$Jdzqh8RAwCB9EKBL9IxWUe4mgCwsgtOftZ78deB2.X/CvoyWZ61aW', '2026-08-30 04:11:31.639667+05:30', 'RS Student 1');
INSERT INTO public.users VALUES ('bdfe5470-6886-49c0-b3d1-6bf1ed957324', 'rostersizetest.student2@test.dev', '$2b$12$qbtBMEjmJeOyOMkwBZ.16OSxzGcOnVcQI7FrC31UGCoTigNf0CclK', '2026-08-30 04:11:31.919237+05:30', 'RS Student 2');
INSERT INTO public.users VALUES ('90209412-6229-4dbc-8f2a-2ee045ede29c', 'sectionsanalyticstest.teacher@test.dev', '$2b$12$g59jNLUPoAOJd0P42KlEIu//1qHHFVqeLdghRGlgfrcXzzVZGEa/G', '2026-08-30 04:11:38.331749+05:30', 'SA Teacher');
INSERT INTO public.users VALUES ('8aa94f2f-7a68-4b71-bb1c-90bea7564fe0', 'sectionswritetest.teacher@test.dev', '$2b$12$lebMF1kPrPq.P6o2sZSCBecaPjqgRkNKX9RkHFI87yhK6p6kq0yAO', '2026-08-30 04:11:49.779614+05:30', 'SW Teacher');
INSERT INTO public.users VALUES ('52f91c72-dfce-4022-998f-4227c9fb3463', 'sectionswritetest.other-teacher@test.dev', '$2b$12$ntfPK.9oX.t3EpEcwHlFOuoxF0KA6Vg2bsuGcSbtWat0DZUj1In9W', '2026-08-30 04:11:49.97373+05:30', 'SW Teacher');
INSERT INTO public.users VALUES ('188982ab-374c-46bd-9b0f-d051c514423f', 'sectionswritetest.student@test.dev', '$2b$12$vXUPrdGHA.egKs6FDpBeDOX1WzyxLlz9oHttsTYpJpPlCrBuoKnrW', '2026-08-30 04:11:50.162641+05:30', 'SW Student');
INSERT INTO public.users VALUES ('3d4400f5-0641-4888-922d-491bef7758cb', 'sectionswritetest.other-student@test.dev', '$2b$12$YvnFJos.lu68quKVPoHkNelrdc4Sh1NKRLzmjdhYBnFtvt9oDavCq', '2026-08-30 04:11:50.354786+05:30', 'SW Other Student');
INSERT INTO public.users VALUES ('e3cce8ff-2595-4e75-9cb6-230e87b2a074', 'studentengagementtest.teacher@test.dev', '$2b$12$Tff.JJvSxtVHHNGFLZozzuTtKANo6vKAmFPquFAveyidHXNr/TE7O', '2026-08-30 04:12:10.425906+05:30', 'SE Teacher');
INSERT INTO public.users VALUES ('b9b9bed9-efe6-4718-98c9-2ff5a2fae2d0', 'studentengagementtest.student@test.dev', '$2b$12$r6kMR0YNJ5GcMYz2y.Zu9.yx99Dhf/HClxaNHGS.ntMjUF.7MqlZa', '2026-08-30 04:12:10.633368+05:30', 'SE Student');
INSERT INTO public.users VALUES ('a0bb983e-80a8-485d-b762-442c34ea512a', 'subjectchaptertest.teacher@test.dev', '$2b$12$b8JGBLP7KpTuCj0x83v9ge7a7/k.6EvPdKaycdKSMhebmcb0cAVBK', '2026-08-30 04:12:16.414895+05:30', 'SC Teacher');
INSERT INTO public.users VALUES ('2f9cf096-0f62-41b9-84c4-815cded2deed', 'testassigntest.studentC@test.dev', '$2b$12$YMTLgGM7WlQ4J3NZVOsuM.IyewUHin24h4RnbrskTeV1N.mNwUkwi', '2026-08-29 08:10:21.602005+05:30', 'Student C');
INSERT INTO public.users VALUES ('47163336-6603-49a4-87db-1282de388df8', 'analyticssectiontest.teacher@test.dev', '$2b$12$Dxg7eAc7rj7MvKH9J2NISeHcumJo9Mb64Lw3hjexOjkESdrUgKeb.', '2026-08-30 04:09:12.247282+05:30', 'AS Teacher');
INSERT INTO public.users VALUES ('78304df8-ef89-4444-981a-4095ce8395aa', 'misconceptionpatterntest.teacher@test.dev', '$2b$12$MaMdjJr0rFNYUDN4l12uY.QfFpIWOsSqkEw9jkqNwfkln7PRcnPyK', '2026-08-30 04:09:43.456491+05:30', 'MP Teacher');
INSERT INTO public.users VALUES ('b7a1747d-0bf3-4980-a0f6-cd88e9e063c2', 'p2b-student@edova.dev', '$2b$12$ijP43KqJteQfoebMFf09weC2Dgxx86LRng3.F2yLeEGfGLpQCdas.', '2026-08-30 04:09:59.227228+05:30', 'P2B Student');


--
-- Data for Name: video_payloads; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.video_payloads VALUES ('ddadefb9-8498-4173-9b97-63d9b4b99391', NULL, 555, NULL, '[]', 'uploads/hls/ddadefb9-8498-4173-9b97-63d9b4b99391/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('f000dedf-7f9f-4b00-ab9c-f1cbc93d8ee4', NULL, 100, NULL, '[]', 'uploads/hls/f000dedf-7f9f-4b00-ab9c-f1cbc93d8ee4/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('0b9a354f-233a-4c52-8169-1cbcdd91aefa', NULL, 299, NULL, '[]', 'uploads/hls/0b9a354f-233a-4c52-8169-1cbcdd91aefa/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('2d818e44-6680-428f-ad93-7e16b2d22280', NULL, 214, NULL, '[]', 'uploads/hls/2d818e44-6680-428f-ad93-7e16b2d22280/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('526ba4cf-682a-4da3-b0b9-9419347b79ee', NULL, 259, NULL, '[]', 'uploads/hls/526ba4cf-682a-4da3-b0b9-9419347b79ee/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('b80664f1-696d-4f28-9072-0f1b5dabd707', NULL, 265, NULL, '[]', 'uploads/hls/b80664f1-696d-4f28-9072-0f1b5dabd707/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('be1f5f65-ecbe-4551-b464-7f8c9c057fe5', NULL, 264, NULL, '[]', 'uploads/hls/be1f5f65-ecbe-4551-b464-7f8c9c057fe5/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('6ec170da-f3b4-4ec7-b459-dbba4396bfa9', NULL, 261, NULL, '[]', 'uploads/hls/6ec170da-f3b4-4ec7-b459-dbba4396bfa9/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('14ec2862-a1cf-4329-99d0-2fb9ecd36c22', NULL, 206, NULL, '[]', 'uploads/hls/14ec2862-a1cf-4329-99d0-2fb9ecd36c22/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('d55fcf19-d65b-4cef-8b7f-d3b5cbd03f4b', NULL, 148, NULL, '[]', 'uploads/hls/d55fcf19-d65b-4cef-8b7f-d3b5cbd03f4b/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('bf8c8c8a-971f-4b57-a2dc-2242832a01aa', NULL, 165, NULL, '[]', 'uploads/hls/bf8c8c8a-971f-4b57-a2dc-2242832a01aa/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('678426f4-061e-4629-a1fc-4eea64aafa1d', NULL, 292, NULL, '[]', 'uploads/hls/678426f4-061e-4629-a1fc-4eea64aafa1d/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('4261ec6b-d94b-49ab-bff6-474db6d24835', NULL, 172, NULL, '[]', 'uploads/hls/4261ec6b-d94b-49ab-bff6-474db6d24835/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('a71e8fef-0837-4233-9f22-3b4242b7f679', NULL, 90, NULL, '[]', 'uploads/hls/a71e8fef-0837-4233-9f22-3b4242b7f679/', 'READY', NULL);
INSERT INTO public.video_payloads VALUES ('a96b71b1-8849-4f7f-8005-6ecdfd823237', NULL, 90, NULL, '[]', 'uploads/hls/a96b71b1-8849-4f7f-8005-6ecdfd823237/', 'READY', NULL);


--
-- Name: trig_interaction_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trig_interaction_logs_id_seq', 1, false);


--
-- Name: trig_student_states_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trig_student_states_id_seq', 4, true);


--
-- Name: trig_telemetry_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trig_telemetry_events_id_seq', 42, true);


--
-- Name: activation_keys activation_keys_key_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_key_code_key UNIQUE (key_code);


--
-- Name: activation_keys activation_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: authored_question_media authored_question_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_media
    ADD CONSTRAINT authored_question_media_pkey PRIMARY KEY (id);


--
-- Name: authored_question_media authored_question_media_storage_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_media
    ADD CONSTRAINT authored_question_media_storage_key_key UNIQUE (storage_key);


--
-- Name: authored_question_versions authored_question_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_versions
    ADD CONSTRAINT authored_question_versions_pkey PRIMARY KEY (id);


--
-- Name: authored_question_versions authored_question_versions_question_id_version_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_versions
    ADD CONSTRAINT authored_question_versions_question_id_version_no_key UNIQUE (question_id, version_no);


--
-- Name: authored_questions authored_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_questions
    ADD CONSTRAINT authored_questions_pkey PRIMARY KEY (id);


--
-- Name: authored_test_assignments authored_test_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_assignments
    ADD CONSTRAINT authored_test_assignments_pkey PRIMARY KEY (id);


--
-- Name: authored_test_questions authored_test_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_questions
    ADD CONSTRAINT authored_test_questions_pkey PRIMARY KEY (id);


--
-- Name: authored_test_questions authored_test_questions_test_id_sequence_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_questions
    ADD CONSTRAINT authored_test_questions_test_id_sequence_order_key UNIQUE (test_id, sequence_order);


--
-- Name: authored_tests authored_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_tests
    ADD CONSTRAINT authored_tests_pkey PRIMARY KEY (id);


--
-- Name: chapters chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_pkey PRIMARY KEY (id);


--
-- Name: chapters chapters_subject_id_sequence_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_subject_id_sequence_order_key UNIQUE (subject_id, sequence_order);


--
-- Name: device_activations device_activations_key_id_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_activations
    ADD CONSTRAINT device_activations_key_id_device_id_key UNIQUE (key_id, device_id);


--
-- Name: device_activations device_activations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_activations
    ADD CONSTRAINT device_activations_pkey PRIMARY KEY (id);


--
-- Name: lab_payloads lab_payloads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_payloads
    ADD CONSTRAINT lab_payloads_pkey PRIMARY KEY (module_id);


--
-- Name: mastery_events mastery_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastery_events
    ADD CONSTRAINT mastery_events_pkey PRIMARY KEY (id);


--
-- Name: modules modules_chapter_id_sequence_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_chapter_id_sequence_order_key UNIQUE (chapter_id, sequence_order);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: progress_events progress_events_client_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_events
    ADD CONSTRAINT progress_events_client_event_id_key UNIQUE (client_event_id);


--
-- Name: progress_events progress_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_events
    ADD CONSTRAINT progress_events_pkey PRIMARY KEY (id);


--
-- Name: question_bank question_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);


--
-- Name: quiz_configurations quiz_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_configurations
    ADD CONSTRAINT quiz_configurations_pkey PRIMARY KEY (module_id);


--
-- Name: quiz_generated_sets quiz_generated_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_generated_sets
    ADD CONSTRAINT quiz_generated_sets_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: sections sections_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: student_lab_submissions student_lab_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lab_submissions
    ADD CONSTRAINT student_lab_submissions_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);


--
-- Name: student_quiz_attempts student_quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_quiz_attempts
    ADD CONSTRAINT student_quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_tenant_id_sequence_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_tenant_id_sequence_order_key UNIQUE (tenant_id, sequence_order);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: topics topics_chapter_id_sequence_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_chapter_id_sequence_order_key UNIQUE (chapter_id, sequence_order);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: trig_concepts trig_concepts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_concepts
    ADD CONSTRAINT trig_concepts_pkey PRIMARY KEY (id);


--
-- Name: trig_interaction_logs trig_interaction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_interaction_logs
    ADD CONSTRAINT trig_interaction_logs_pkey PRIMARY KEY (id);


--
-- Name: trig_prerequisites trig_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_prerequisites
    ADD CONSTRAINT trig_prerequisites_pkey PRIMARY KEY (concept_id, prerequisite_id);


--
-- Name: trig_student_states trig_student_states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_student_states
    ADD CONSTRAINT trig_student_states_pkey PRIMARY KEY (id);


--
-- Name: trig_telemetry_events trig_telemetry_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_telemetry_events
    ADD CONSTRAINT trig_telemetry_events_pkey PRIMARY KEY (id);


--
-- Name: user_tenant_mappings user_tenant_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenant_mappings
    ADD CONSTRAINT user_tenant_mappings_pkey PRIMARY KEY (id);


--
-- Name: user_tenant_mappings user_tenant_mappings_user_id_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenant_mappings
    ADD CONSTRAINT user_tenant_mappings_user_id_tenant_id_key UNIQUE (user_id, tenant_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: video_payloads video_payloads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_payloads
    ADD CONSTRAINT video_payloads_pkey PRIMARY KEY (module_id);


--
-- Name: idx_activation_keys_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activation_keys_tenant ON public.activation_keys USING btree (tenant_id);


--
-- Name: idx_audit_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_actor ON public.admin_audit_log USING btree (actor_user_id);


--
-- Name: idx_audit_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_at ON public.admin_audit_log USING btree (at DESC);


--
-- Name: idx_authored_question_media_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_question_media_version ON public.authored_question_media USING btree (question_version_id);


--
-- Name: idx_authored_question_versions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_question_versions_created_by ON public.authored_question_versions USING btree (created_by);


--
-- Name: idx_authored_question_versions_question_type_diff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_question_versions_question_type_diff ON public.authored_question_versions USING btree (question_id, question_type, difficulty);


--
-- Name: idx_authored_questions_chapter_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_questions_chapter_status_created ON public.authored_questions USING btree (chapter_id, status, created_at DESC);


--
-- Name: idx_authored_questions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_questions_created_by ON public.authored_questions USING btree (created_by);


--
-- Name: idx_authored_test_questions_test; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_test_questions_test ON public.authored_test_questions USING btree (test_id);


--
-- Name: idx_authored_test_questions_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_test_questions_version ON public.authored_test_questions USING btree (question_version_id);


--
-- Name: idx_authored_tests_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_tests_chapter ON public.authored_tests USING btree (chapter_id);


--
-- Name: idx_authored_tests_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_authored_tests_created_by ON public.authored_tests USING btree (created_by);


--
-- Name: idx_lab_submission_student_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_submission_student_module ON public.student_lab_submissions USING btree (student_id, module_id);


--
-- Name: idx_mastery_events_classroom_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastery_events_classroom_chapter ON public.mastery_events USING btree (classroom_id, chapter_id);


--
-- Name: idx_mastery_events_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastery_events_student ON public.mastery_events USING btree (student_id, chapter_id, created_at);


--
-- Name: idx_modules_chapter_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_chapter_sequence ON public.modules USING btree (chapter_id, sequence_order);


--
-- Name: idx_modules_topic_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_topic_sequence ON public.modules USING btree (topic_id, sequence_order);


--
-- Name: idx_progress_events_student_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_events_student_module ON public.progress_events USING btree (student_id, module_id);


--
-- Name: idx_progress_key_module; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_progress_key_module ON public.student_progress USING btree (activation_key_id, module_id) WHERE (activation_key_id IS NOT NULL);


--
-- Name: idx_progress_student_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_progress_student_status ON public.student_progress USING btree (student_id, status);


--
-- Name: idx_progress_user_module; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_progress_user_module ON public.student_progress USING btree (student_id, module_id) WHERE (student_id IS NOT NULL);


--
-- Name: idx_qgs_key_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qgs_key_module ON public.quiz_generated_sets USING btree (activation_key_id, module_id);


--
-- Name: idx_qgs_student_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qgs_student_module ON public.quiz_generated_sets USING btree (student_id, module_id);


--
-- Name: idx_question_bank_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_question_bank_hash ON public.question_bank USING btree (content_hash);


--
-- Name: idx_question_bank_selection; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_bank_selection ON public.question_bank USING btree (chapter_id, year, difficulty);


--
-- Name: idx_question_bank_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_bank_subject ON public.question_bank USING btree (subject_id);


--
-- Name: idx_quiz_attempt_student_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_attempt_student_module ON public.student_quiz_attempts USING btree (student_id, module_id);


--
-- Name: idx_quiz_attempt_student_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_attempt_student_time ON public.student_quiz_attempts USING btree (student_id, submitted_at);


--
-- Name: idx_subjects_global_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_subjects_global_sequence ON public.subjects USING btree (sequence_order) WHERE (tenant_id IS NULL);


--
-- Name: idx_subjects_tenant_grade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subjects_tenant_grade ON public.subjects USING btree (tenant_id, standard_grade);


--
-- Name: idx_test_assignments_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_assignments_section ON public.authored_test_assignments USING btree (section_id);


--
-- Name: idx_test_assignments_test; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_assignments_test ON public.authored_test_assignments USING btree (test_id);


--
-- Name: idx_user_tenant_mappings_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tenant_mappings_section ON public.user_tenant_mappings USING btree (section_id);


--
-- Name: idx_user_tenant_mappings_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tenant_mappings_tenant ON public.user_tenant_mappings USING btree (tenant_id);


--
-- Name: ix_trig_interaction_logs_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_interaction_logs_student_id ON public.trig_interaction_logs USING btree (student_id);


--
-- Name: ix_trig_interaction_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_interaction_logs_timestamp ON public.trig_interaction_logs USING btree ("timestamp");


--
-- Name: ix_trig_student_states_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_student_states_student_id ON public.trig_student_states USING btree (student_id);


--
-- Name: ix_trig_telemetry_events_concept_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_telemetry_events_concept_id ON public.trig_telemetry_events USING btree (concept_id);


--
-- Name: ix_trig_telemetry_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_telemetry_events_event_type ON public.trig_telemetry_events USING btree (event_type);


--
-- Name: ix_trig_telemetry_events_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_telemetry_events_student_id ON public.trig_telemetry_events USING btree (student_id);


--
-- Name: ix_trig_telemetry_events_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_trig_telemetry_events_timestamp ON public.trig_telemetry_events USING btree ("timestamp");


--
-- Name: activation_keys activation_keys_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: admin_audit_log admin_audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: authored_question_media authored_question_media_question_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_media
    ADD CONSTRAINT authored_question_media_question_version_id_fkey FOREIGN KEY (question_version_id) REFERENCES public.authored_question_versions(id) ON DELETE CASCADE;


--
-- Name: authored_question_media authored_question_media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_media
    ADD CONSTRAINT authored_question_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: authored_question_versions authored_question_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_versions
    ADD CONSTRAINT authored_question_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: authored_question_versions authored_question_versions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_question_versions
    ADD CONSTRAINT authored_question_versions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.authored_questions(id) ON DELETE CASCADE;


--
-- Name: authored_questions authored_questions_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_questions
    ADD CONSTRAINT authored_questions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;


--
-- Name: authored_questions authored_questions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_questions
    ADD CONSTRAINT authored_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: authored_questions authored_questions_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_questions
    ADD CONSTRAINT authored_questions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;


--
-- Name: authored_test_assignments authored_test_assignments_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_assignments
    ADD CONSTRAINT authored_test_assignments_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: authored_test_assignments authored_test_assignments_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_assignments
    ADD CONSTRAINT authored_test_assignments_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.authored_tests(id) ON DELETE CASCADE;


--
-- Name: authored_test_questions authored_test_questions_question_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_questions
    ADD CONSTRAINT authored_test_questions_question_version_id_fkey FOREIGN KEY (question_version_id) REFERENCES public.authored_question_versions(id);


--
-- Name: authored_test_questions authored_test_questions_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_test_questions
    ADD CONSTRAINT authored_test_questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.authored_tests(id) ON DELETE CASCADE;


--
-- Name: authored_tests authored_tests_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_tests
    ADD CONSTRAINT authored_tests_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;


--
-- Name: authored_tests authored_tests_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_tests
    ADD CONSTRAINT authored_tests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: chapters chapters_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chapters
    ADD CONSTRAINT chapters_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: device_activations device_activations_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_activations
    ADD CONSTRAINT device_activations_key_id_fkey FOREIGN KEY (key_id) REFERENCES public.activation_keys(id) ON DELETE CASCADE;


--
-- Name: authored_questions fk_authored_questions_current_version; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authored_questions
    ADD CONSTRAINT fk_authored_questions_current_version FOREIGN KEY (current_version_id) REFERENCES public.authored_question_versions(id) ON DELETE SET NULL;


--
-- Name: lab_payloads lab_payloads_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_payloads
    ADD CONSTRAINT lab_payloads_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: modules modules_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;


--
-- Name: modules modules_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE SET NULL;


--
-- Name: progress_events progress_events_activation_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_events
    ADD CONSTRAINT progress_events_activation_key_id_fkey FOREIGN KEY (activation_key_id) REFERENCES public.activation_keys(id) ON DELETE CASCADE;


--
-- Name: progress_events progress_events_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_events
    ADD CONSTRAINT progress_events_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: progress_events progress_events_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_events
    ADD CONSTRAINT progress_events_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: question_bank question_bank_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id);


--
-- Name: question_bank question_bank_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: quiz_configurations quiz_configurations_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_configurations
    ADD CONSTRAINT quiz_configurations_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: quiz_generated_sets quiz_generated_sets_activation_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_generated_sets
    ADD CONSTRAINT quiz_generated_sets_activation_key_id_fkey FOREIGN KEY (activation_key_id) REFERENCES public.activation_keys(id);


--
-- Name: quiz_generated_sets quiz_generated_sets_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_generated_sets
    ADD CONSTRAINT quiz_generated_sets_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: quiz_generated_sets quiz_generated_sets_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_generated_sets
    ADD CONSTRAINT quiz_generated_sets_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: sections sections_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: student_lab_submissions student_lab_submissions_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lab_submissions
    ADD CONSTRAINT student_lab_submissions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id);


--
-- Name: student_lab_submissions student_lab_submissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lab_submissions
    ADD CONSTRAINT student_lab_submissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: student_lab_submissions student_lab_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_lab_submissions
    ADD CONSTRAINT student_lab_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: student_progress student_progress_activation_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_activation_key_id_fkey FOREIGN KEY (activation_key_id) REFERENCES public.activation_keys(id) ON DELETE CASCADE;


--
-- Name: student_progress student_progress_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: student_progress student_progress_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: student_quiz_attempts student_quiz_attempts_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_quiz_attempts
    ADD CONSTRAINT student_quiz_attempts_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id);


--
-- Name: student_quiz_attempts student_quiz_attempts_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_quiz_attempts
    ADD CONSTRAINT student_quiz_attempts_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: student_quiz_attempts student_quiz_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_quiz_attempts
    ADD CONSTRAINT student_quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- Name: subjects subjects_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: subscriptions subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: topics topics_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id) ON DELETE CASCADE;


--
-- Name: trig_interaction_logs trig_interaction_logs_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_interaction_logs
    ADD CONSTRAINT trig_interaction_logs_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.trig_concepts(id) ON DELETE CASCADE;


--
-- Name: trig_prerequisites trig_prerequisites_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_prerequisites
    ADD CONSTRAINT trig_prerequisites_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.trig_concepts(id) ON DELETE CASCADE;


--
-- Name: trig_prerequisites trig_prerequisites_prerequisite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_prerequisites
    ADD CONSTRAINT trig_prerequisites_prerequisite_id_fkey FOREIGN KEY (prerequisite_id) REFERENCES public.trig_concepts(id) ON DELETE CASCADE;


--
-- Name: trig_student_states trig_student_states_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trig_student_states
    ADD CONSTRAINT trig_student_states_concept_id_fkey FOREIGN KEY (concept_id) REFERENCES public.trig_concepts(id) ON DELETE CASCADE;


--
-- Name: user_tenant_mappings user_tenant_mappings_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenant_mappings
    ADD CONSTRAINT user_tenant_mappings_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: user_tenant_mappings user_tenant_mappings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenant_mappings
    ADD CONSTRAINT user_tenant_mappings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: user_tenant_mappings user_tenant_mappings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenant_mappings
    ADD CONSTRAINT user_tenant_mappings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: video_payloads video_payloads_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_payloads
    ADD CONSTRAINT video_payloads_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


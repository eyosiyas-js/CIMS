--
-- PostgreSQL database dump
--

\restrict FsjGoWPX1lieUjgzlQcS4VnSJJPNj4xH7kltQiR9CgyRZU3g65JYVEHa460LQqO

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: camera; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camera (
    id character varying NOT NULL,
    name character varying NOT NULL,
    location character varying,
    lat double precision,
    lng double precision,
    status character varying,
    is_flagged boolean,
    stream_url character varying,
    camera_stream_id character varying,
    organization_id character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    linked_traffic_company_id character varying
);


ALTER TABLE public.camera OWNER TO postgres;

--
-- Name: cameraaccess; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cameraaccess (
    id character varying NOT NULL,
    camera_id character varying NOT NULL,
    organization_id character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.cameraaccess OWNER TO postgres;

--
-- Name: detection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detection (
    id character varying NOT NULL,
    category character varying NOT NULL,
    name character varying,
    description character varying,
    age character varying,
    location character varying,
    subcategory character varying,
    crime_type character varying,
    image_urls json,
    status character varying,
    detected_camera_ids json,
    user_id character varying,
    organization_id character varying,
    form_template_id character varying,
    dynamic_data json,
    detection_events json,
    plate_number character varying,
    code character varying,
    region character varying,
    assigned_company_id character varying,
    handling_status character varying,
    eligible_for_assignment boolean,
    handling_notes character varying,
    handling_proof_urls json,
    face_embedding bytea,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    allow_external_assignment boolean
);


ALTER TABLE public.detection OWNER TO postgres;

--
-- Name: formtemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formtemplate (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description character varying,
    fields json,
    is_active boolean,
    organization_id character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.formtemplate OWNER TO postgres;

--
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    id character varying NOT NULL,
    type character varying,
    title character varying NOT NULL,
    message character varying NOT NULL,
    read boolean,
    action_url character varying,
    user_id character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- Name: officerlocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.officerlocation (
    id character varying NOT NULL,
    user_id character varying,
    organization_id character varying,
    lat double precision,
    lng double precision,
    heading double precision,
    speed double precision,
    is_online boolean,
    last_seen timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.officerlocation OWNER TO postgres;

--
-- Name: organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization (
    id character varying NOT NULL,
    name character varying NOT NULL,
    admin_email character varying NOT NULL,
    status character varying,
    features json,
    parent_id character varying,
    lat double precision,
    lng double precision,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    company_type character varying
);


ALTER TABLE public.organization OWNER TO postgres;

--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description character varying,
    permissions json,
    organization_id character varying,
    users_count integer,
    is_system boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.role OWNER TO postgres;

--
-- Name: trafficalert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trafficalert (
    id character varying NOT NULL,
    detection_id character varying,
    officer_id character varying,
    camera_id character varying,
    organization_id character varying,
    status character varying,
    distance_km double precision,
    notes character varying,
    proof_urls json,
    accepted_at timestamp without time zone,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.trafficalert OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    organization_id character varying,
    role_id character varying,
    status character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    expo_push_token character varying
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: weapondetection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weapondetection (
    id character varying NOT NULL,
    weapon_type character varying NOT NULL,
    description character varying,
    confidence double precision,
    image_url character varying,
    camera_id character varying,
    camera_name character varying,
    organization_id character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.weapondetection OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
b16522185c2f
\.


--
-- Data for Name: camera; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.camera (id, name, location, lat, lng, status, is_flagged, stream_url, camera_stream_id, organization_id, created_at, updated_at, linked_traffic_company_id) FROM stdin;
cam-4c261426	Main Entrance Camera	Main Lobby	9.0192	38.7468	online	t	rtsp://admin:admin@172.20.82.155:554/axis-media/media.amp	\N	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	2026-04-03 09:00:33.996261	2026-04-07 14:11:10.626015	\N
cam-cb940588	Parking Lot Exit	North Gate	9.00999284302376	38.76981671803979	online	t	rtsp://admin:Eyosias0909@172.20.82.85:554/cam/realmonitor?channel=1&subtype=0	\N	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	2026-04-03 09:00:33.996267	2026-04-07 14:11:10.692536	\N
\.


--
-- Data for Name: cameraaccess; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cameraaccess (id, camera_id, organization_id, created_at, updated_at) FROM stdin;
acc-48c3a896-ba94-4725-86f7-216d3bc2b1ce	cam-4c261426	org-admin-main	2026-04-03 11:08:55.618971	2026-04-03 11:08:55.618974
acc-b8ef41f7-f554-46f9-a16a-f0c347de2690	cam-cb940588	org-admin-main	2026-04-03 11:08:57.747146	2026-04-03 11:08:57.747149
acc-7e77653e-1abe-4044-80c3-7bf771b3b338	cam-cb940588	comp-f5686e69-8379-4037-9bce-aa658ab27539	2026-04-03 11:08:58.371319	2026-04-03 11:08:58.371324
acc-b9405cfd-cc5b-4ccc-b16a-147357408e01	cam-4c261426	comp-f5686e69-8379-4037-9bce-aa658ab27539	2026-04-03 12:26:32.440794	2026-04-03 12:26:32.440799
acc-489232ad-70d0-4445-892b-4f4faea1ee3d	cam-4c261426	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	2026-04-03 13:18:39.625474	2026-04-03 13:18:39.625479
acc-fbb67b31-1bdc-410e-b102-c39ce97aa420	cam-cb940588	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	2026-04-03 13:18:43.102046	2026-04-03 13:18:43.102051
acc-fbce1bcc-cb17-4dab-b598-b4f0a1b8b1fd	cam-4c261426	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	2026-04-15 10:37:19.956635	2026-04-15 10:37:19.956642
acc-a42e5af0-f150-4958-bc9a-6e508617db9b	cam-cb940588	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	2026-04-15 10:37:22.42738	2026-04-15 10:37:22.427385
\.


--
-- Data for Name: detection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detection (id, category, name, description, age, location, subcategory, crime_type, image_urls, status, detected_camera_ids, user_id, organization_id, form_template_id, dynamic_data, detection_events, plate_number, code, region, assigned_company_id, handling_status, eligible_for_assignment, handling_notes, handling_proof_urls, face_embedding, created_at, updated_at, allow_external_assignment) FROM stdin;
det-1928573815056	criminal	Eyosiyas	Detected at 2026-04-15 16:53:50	19	Live Engine	criminal	Kidnapping	["/uploads/41d30cb4-a94e-410f-a096-0ddb81604c7e.jpg"]	detected	["cam-4c261426", "cam-cb940588"]	usr-1929273432320	comp-f5686e69-8379-4037-9bce-aa658ab27539	\N	null	[{"id": "625aa856-0992-4e88-b86b-63e111167674", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T10:07:54.797382", "snapshotUrl": "https://picsum.photos/seed/cam-4c261426_1775459274/800/450"}, {"id": "c8fa1520-2eb5-47bf-8ead-1b6ee141c1b1", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T10:09:32.799250", "snapshotUrl": "https://picsum.photos/seed/cam-4c261426_1775459372/800/450"}, {"id": "cfd5eea9-157d-4b15-a00f-5b004ea7dc5b", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T10:09:50.204936", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775459390/800/450"}, {"id": "a9d98cfc-9561-428a-9eba-b975d35149dd", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T10:32:46.983955", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775460766/800/450"}, {"id": "81fc7cc0-bc02-4131-aa05-85bdf449cf5f", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T10:32:56.569736", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775460776/800/450"}, {"id": "02923177-ce86-4030-a618-8337dff8cb6a", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T12:40:37.937427", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775468437/800/450"}, {"id": "e5227fcb-d196-404c-8eea-c224d4a3d296", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T12:40:42.537461", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775468442/800/450"}, {"id": "18679858-c5c0-4bca-b2d4-ced31f58a8b6", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T12:53:25.552759", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775469205/800/450"}, {"id": "359c0e63-a786-4c5c-82f7-8107f8519dd2", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T12:53:32.400488", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775469212/800/450"}, {"id": "431844a2-062b-47d9-bac6-4ba2648d8d6c", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T12:53:51.659851", "snapshotUrl": "/uploads/f73b01fd-63a2-49f9-9987-7a0d07aa4f5c.jpg"}, {"id": "23a017fd-bfb8-421a-a252-e414f813668b", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:06:23.678557", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775469983/800/450"}, {"id": "21b0e00b-3d4b-4ac3-8886-b52199984ace", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:06:32.674379", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775469992/800/450"}, {"id": "193c60d4-5759-4338-89e2-080abd4dc588", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:06:46.911574", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775470006/800/450"}, {"id": "d7785796-b6d1-47c7-b2d2-cdf183194ff3", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:09:18.376313", "snapshotUrl": "/uploads/2ecf75a5-2d94-4964-a059-98da87c82e6d.jpg"}, {"id": "df368a4f-70ec-475a-a536-c17c483cc74d", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:20:33.894811", "snapshotUrl": "/uploads/b2284aa4-aeef-4f50-9349-9e144efac088.jpg"}, {"id": "7a0169d8-9d5e-4d9e-ad39-976e3d74cf15", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:20:46.529200", "snapshotUrl": "/uploads/1f5c3ec4-3a8b-4cc7-9d69-d36922d28e52.jpg"}, {"id": "b53e0863-25eb-4676-b49b-eb3aacb6cc08", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:22:43.733514", "snapshotUrl": "/uploads/e91918d7-b0d6-4d4c-8fcc-bdf777544e2c.jpg", "snapshotUrls": ["/uploads/e91918d7-b0d6-4d4c-8fcc-bdf777544e2c.jpg", "/uploads/ee252315-c600-4b7e-94d9-139d840aee5e.jpg", "https://picsum.photos/seed/cam-cb940588_1775470999/800/450"]}, {"id": "09c98c9e-ebdd-46b7-922c-44dc5ae6e63a", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T07:07:58.000562", "snapshotUrl": "/uploads/92e7d934-a3ed-4135-b996-14a8671d9d8a.jpg", "snapshotUrls": ["/uploads/92e7d934-a3ed-4135-b996-14a8671d9d8a.jpg"]}, {"id": "29c95d14-6b35-4b91-a206-527e6efdb370", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T07:14:53.255428", "snapshotUrl": "/uploads/99287f8d-9947-44a0-a540-562b17ff17bd.jpg", "snapshotUrls": ["/uploads/99287f8d-9947-44a0-a540-562b17ff17bd.jpg"]}, {"id": "cd09734e-6b52-4ba2-8a8b-7c4f4d176096", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-15T12:51:17.734119", "snapshotUrl": "https://picsum.photos/seed/cam-4c261426_1776246677/800/450", "snapshotUrls": ["https://picsum.photos/seed/cam-4c261426_1776246677/800/450"]}, {"id": "d0d50cc4-939e-4358-b8ff-3abcf5f01e28", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-15T13:53:42.757138", "snapshotUrl": "/uploads/a8bed1f6-3a72-4808-8d2f-02f3a3b466fd.jpg", "snapshotUrls": ["/uploads/a8bed1f6-3a72-4808-8d2f-02f3a3b466fd.jpg"]}]	\N	\N	\N	comp-f5686e69-8379-4037-9bce-aa658ab27539	pending	t	\N	\N	\\x5376a0bfbb97cdbf8dd70cbfffc067bf6b9d863ed22790bf7e1b423e221b9fbe239058bf5fa23ebfa9940bc09468683f04e12c3dbad59dbf38a706bfec686e3f6c3705bfc54e88bf4c59853e85dafb3dc92595be1772833f71e47bbf06edf53d42948dbfa8b1c43c23f183bff100e6be786630c038bf9cbddcfb143f23b614400c1121bfe5df83be8575df3e9204553f2526b4beb71586bf44a45cbf373ff8bdb162a43f4cd1a83ef292243ed0c5823e78f053c0784ee9beae8a933fc9cb10bfc5140a40120c323f286cae3e152ebcbee769ae3f19b23e3f8ee09e3e2cacc53d899bdfbf0cd9223f8785c7bed67acb3ec2c42cbff834a6bfc849ff3f8ebdc93ef4a89f3f71b7a53fb299d8bec6da253e47862bc0f7f4bfbfef89a9be2615a2bf562c3fbfc7b4b8bf06019f3efffd313f2603803f5354083d8febdb3eb40655bf5274bdbfc0dc0fbffde785bf43b0013f8ac97abfd45a353e78b55cbfc8c3b0bf4b244bbfc0774bbedeb6103f2bc137bf7b97adbfac3682bf3eda87bf03f881bffb4686be474d94bfa07aacbe7d1bb7bfdaaef83e5a2a04bfee44314021f4523eb7e79dbe1be534bfb831313f8b69843f83d95bbf96f779bf632f473f1a7a023f17561cc0fa57dfbf31011640c22eaf3f54c308bf2eadeb3e409f883e9b2f0f3fa3c6713f345f49bf0ad16c3e9457423f9f0c33bf777dddbead8dd53e7fb96f3f6a4ef03e5ec22dbf033da2bf8ff9af3f34f9543ff8cf01bf15e716c0b37c4c3f8bef39402bd4023faea627bfce73f23d1683c0be692fafbf658599bfa9b16cbfbe21993f709cb7be0f0603bfca113d3ff077743f5f5c83bddba6e53e4aa5883ff0ee9bbf409ecd3d978cd7bf53a2753f3e90b43e6e8923beabcf07be8b70c1be27d3a23ee88febbe8f003cc0740c93bf513d053f9e66f8bfd2b73140a85567beba1e10bfb2f9243fa1fc0f3fd4cee0beeac8ba3f6f4800bf50f0d1becd2419be09dad0bf547e8c3f7e2df6beeb85ecbe729e5ebe2bcb963f4259d03f12b6c83e94ac983e3857393eeef52fbdb47b89beae30d13f46a1c23fc49cddbede4edebedc537f3f28c8cdbf76e95bbff8f5643f8124053f8d3a06be0183203f36c63b3f60f049bb8237143ee2f7a13fe2a6c7bf1e78a3bf7c492b40147c003fd4c89d3d65214f3ff2591b3fa2e4e8bf815cb6bff2570e3f2f99583f1128cb3f090b03bf0e65593f2728a0bfa31a4e3f94dff13df875d63d2184283ff0a41b3f906fb23e9186e2bf132044bebe2e184021b505bf6249b23ebe85b23deaa7b73f35d6a7bf2c1a38bff404843e7a283a403218da3ef164cbbf9271473f7233583f254806c015f90fc04ff3f73f8adb843fae66ff3fd0b72dc06aabc23fa01595bfc2e169bf5a33f1beec1da2bedb910c3fefc6893e1a74a63f625db63f8b8fff3f9bb7f1bed8f9c73d20ee813f85a7cebfaeb5d13fa0c41a3ea2dea83f268f44bdc1b64b3fb8a7263f3c9ed43d9946973fb769f3be7183eabf624f0ebe1f45ac3f9579483e2ab907bf8e3d13bf4e638abf695005c00a333fc05633b9bfa3588fbf794810402474563f7ae5a4bfd1b6123f17737a3d4eede73eb9fc7dbe688736bf7c331d3f5a2905bffd4f2d3f11bd2f40151bce3f668b01bfa03500bfac1dad3de4d8ccbf924415c02037b33fd2cc143d50a2004034bbe73f0387bfbfdeb03abdfd38a43dc003a2be6894823f3f72013f2cfd9b3ef53f8d3edd0496bf928a503f600cac3ee041be3f9ad7054021a1d83f9fc06fbf4146a9be62b8d7bfa0ce773e42de59bf01ab4e3f9fa504bf2f8157bf8e6dbbbf5ba776be3653823e26480c3d67e7123fc61a24bf830ac7be97a54f3e0cab0840f85185bf90c168bc1785bf3ee8b50e3ef1480abf7a949c3fa82491bf447ee3bde5727cbffb486cbf5359973ecb35eebe7eefc5be230e20bf34e6363fe03ab43f62b0cc3fa42c8a3ef3f409bff17e193f5631edbfe068e73e39bb9f3ff38a363f06ab8dbf64c7153fd6751cbfff611ebf100568bd17fc883d88a50bbf7bc46fbf262d703ff4a9abbf68cd9fbfa7ac34bef4f178bee8b0843f320d4dbf47ca6ebff0aa663ded3ac43d027290bf816b613ffb9ab13fdaa51e3eb4739cbe1517db3e7e0870bed04d2ebd0df2813e9eb2d3bf096ffb3e081ed7bd1097a13f8135d4bf1837d9be722d943f2454bc3e08c1ef3f4bf3dfbf7ab0b8bf44737bbed2eed03ef5a4ab3f1c3acebd8538c13dc615433f85de6ebed9a0403e802100c0eebcf4bed4d84fbd9319a0bf6019aebfb040fdbc6e26463f0ad4b4bf3cf2fa3ebd31d6bf87a8ab3fffdcea3f3be69c3f80b2b8bb4e2dedbe30f208bfb55cf43d8665d33eae24e43f2c969abf6aad3dbec2cc013e007882bf57859c3f60a5703ff856c2bfddbf1d408bbc9a3fdafb6fbe4e690040467e033eb06d0cbf5b73ffbee0d1cabf2fe867be8880cc3ea5b7363ff64e6dbfe364e33ed2ef9dbe72de2dbfce2dac3e3d3884be1c0e15c0fed508bf4147ae3f3b69afbe59f6f8bf5865d2bc0f8ea1bf82869abf8184c13fcbe438bfb77406407c7ca6bf723f0ec0046723bf309d96be79b9c33e38650f3f6a299a3e4fac03bfb0b01a3c3eaa5fbeca33533f8860c9be168426bee98723403dbd4ebfc36902c00fce0ac02ef4cdbf4a6c8dbefa1ca5bfd29935be3e7314be4a51f9bd3e1ee53f4a51c63e288b2dbffa4fdbbf06f2d93e474d87beb0b703bec291a7bea1d8f2be66e6033f5edd8c3f9f7cedbf0a6e593f7f87b0bf33f759bf6ff0ec3f0625114072aca83f6cf5733f5a1a97be9ffc1a3f1aec4b3f0a081dbf5a5f723e1e70273f67af77bf9799e03f342f8dbfcee0503e352e16bf4edcd03e471e363f5359113f	2026-04-03 08:39:15.431907	2026-04-15 13:53:42.763616	\N
det-2936773553008	criminal	Dejene	Detected at 2026-04-15 10:51:05	32	Live Engine	criminal	Cybercrime	["/uploads/06e6d92e-d145-4d87-be0c-92a1b236ebc2.jpeg", "/uploads/97c7254a-acf3-4d8f-8597-412ef1857c67.jpeg"]	detected	["cam-4c261426", "cam-cb940588"]	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	\N	null	[{"id": "e6c07061-67b8-468e-9416-43042090039d", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:00.370271", "snapshotUrl": "/uploads/a6536775-5613-44d5-a02a-06a1dfad3f28.jpg"}, {"id": "a58c6e02-00b0-4c10-a87b-202e421fe017", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:05.510443", "snapshotUrl": "/uploads/34807bcb-2fa6-4dc5-8194-e51151dc8174.jpg"}, {"id": "26bdd42f-6694-41f4-8f28-4556423d0d90", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:11.277184", "snapshotUrl": "/uploads/42c32237-226c-4d39-8070-839ebb21adde.jpg"}, {"id": "9c7cfa85-3ca5-46cb-add8-65d22131c341", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:18.722076", "snapshotUrl": "/uploads/834e47ea-f239-467c-b729-018414bfe18f.jpg"}, {"id": "02686f3d-38c9-458f-bd76-8309e1b03adf", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:24.070947", "snapshotUrl": "/uploads/07246311-7ba0-407a-949c-309de54aca07.jpg"}, {"id": "0d02795e-0203-4f5d-ba7f-e89d0b7dbfd8", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:39.666738", "snapshotUrl": "/uploads/d2a0aee2-74a6-45af-867c-66dde57e57e5.jpg"}, {"id": "f12644b1-7fd7-4d25-b5a5-6792c23821f1", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:46.558667", "snapshotUrl": "/uploads/eb1c5dbe-a71e-4e57-b7b7-65c632d29964.jpg"}, {"id": "5e840e5d-d646-4f74-abb8-33121351c7bf", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:51.837374", "snapshotUrl": "/uploads/6ae7c1a4-2903-4693-9a4c-a8c369b7fe2e.jpg"}, {"id": "11492fa0-7922-4994-91c8-c5e951b7e119", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:27:56.947300", "snapshotUrl": "/uploads/7dca1eb6-7320-470a-8654-cf47cba394b0.jpg"}, {"id": "8cd39c03-e4ba-4f91-9d2f-cf6771747f55", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:28:02.555612", "snapshotUrl": "/uploads/f558b9cb-9676-49cb-bf9c-b8d36452f9b6.jpg"}, {"id": "bf8ce1b0-2d48-4c66-8099-eed5fafda584", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:28:08.299441", "snapshotUrl": "/uploads/0686621d-b28f-4ec7-92c2-aba40a72ea40.jpg"}, {"id": "e2fae8d6-dab3-48c7-9490-0e0fcc09936e", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:31:43.236765", "snapshotUrl": "/uploads/62c41959-ec44-40c6-bb34-b896ccac435d.jpg"}, {"id": "b2c763c8-db5c-4e1e-8842-975040cf1872", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:34:40.451211", "snapshotUrl": "/uploads/dd4e4348-db33-46ba-9e75-6a3b7acae6bc.jpg"}, {"id": "a449f4f8-852e-4fcc-aebf-9f75d32edea0", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-15T07:50:57.888226", "snapshotUrl": "/uploads/0f7c652e-06db-4d33-926f-bcdf84c044a3.jpg", "snapshotUrls": ["/uploads/0f7c652e-06db-4d33-926f-bcdf84c044a3.jpg"]}]	\N	\N	\N	comp-f5686e69-8379-4037-9bce-aa658ab27539	resolved	t	captured	\N	\\xc030103f4dd4723ee8be94bd3f3b31bf99affbbede7117be7c8dcebedee9ddbfef09c53ecebad43d5f568c3e9fb3273f743bedbdd2351a3fcc1dbfbf233301bf1597433f5a319d3f92c6f63d435b513fca97033fb8efde3d277489bf9a0ac8bebbebac3e3f88b93e333a4dbe3c82d5bf268489bfb02d5cbcd1027fbe360cc93f7517cbbef86716bfcb58df3f8339b63f80e4e4bfad1bdd3f0f878e3e5384b53ee13ed1bd7d108b3f1635a33fbcbac5bcbc0f7fbf1c73723e80511fbceb69253e836f423d0fa0da3e394237beda9ae93f988d593e8f5c05c0a9728d3f798f843f4255ee3ef0821fbefbf3fb3e1e099cbd95b2c1bf0691bb3e5fc92b3eaff520bf05061d3f75a1b3bf7bd280be56e4863f56591d3f5cebb93ee88e0bbeba3df73fe9720e409dad313e62e1fb3edadfd63f7361d93d793536bf54861440bb2699bfcfdf503fac264a3ffe4537bfb1481f3d79d3003dd68be23e970f8a3e349504bfe6197b3f306b73bf4a2f283f7d6f753f6e246a3f4316413fba1c13bfbcce12bfd83a49bf0558483f226589bfd2a4273f4064aa3e257183bfb29d40408abf8a3fe46ee43e31c93bbfa60c163d148eb23fb9a10dbf3c26fcbf9c1d16bec9929d3ebadba73fab7d04c05c9fb8becc5701403d12e8be9c0ba0be08b109bf1860333de22cec3e0cb0c43e02cd263fbe90b7bf282a063fce3844bf8ed7cbbc95af313fb7c537be5a9aca3e26cd03bf1d97d0bea7df7bbe122f383fec2ffebf4cf33d3ec5d15cbf0bbde3bfd163a5bf8a4754be4027033fb45b793f64c3403fd608fa3fc54207bf418574beb342463f941b8cbfa9272d3f8657cdbe79e1be3f7f40043eb93320bef97b06bf779295bf497034bfa433f13ef932fcbfefd3183f9e160ebe1a34933e3d03303ff841053ea5fe4e3f8b5ab4bf8487bf3f2bf9813f634775bfbd3a46bf0f732bbf3890f8bd06130a3fefbc14bf0e41013f25a1bd3f407216bff1f9003ff8717abd9c0f693d0a8b3dbf82b390bf246c0e3f6c47313f22e36a3f1576f83ea874ce3df33eaa3dd035cb3e7a3ab93f1a8bfbbe04a37bbf7bc7a03df25cafbf35228ebfa27205bf345085bfe0b9f0bd90e3503feefe47bd36e36b3fe1dd98bfb6577dbf7669da3e0b0ed0bf4876d63fdb619e3f61af023f2347653fd9f0f53efdf05bbf50548f3fa2fe48bec852c6be3c35b83ebc0be2bed43a29be8e648b3d27e0453d55b350bf3e320c3fb819473e7fc9bd3ff3776abead2ea73e13dd8dbfa5070fbf903884bf7e43a0bfc221bdbdbd502dbf33bd4fbeb01f1dbd08b40a3f9e17d0bf277b823ed44b013f864e6f3fa851423f0e09c23de2ca523fdd4702c0f8fbdfbe90fc7d3f2cdfc0beff586b3d13c9014080bb1ebe1f4a883f0b5e5fbf0d3a283f1fdcfabe889898bcfa45833fe3dc80beadfc97bed26832bf98ab2e3c55272f40c3efea3fe7cedf3ed372d5befb082f3f4abf4c3f05e81fbe701c5abf688ac33e6112ffbed3eef33ec5b032bffccfbdbe20da60bd53c845bf9dbf01bf2ea9a6beeeed9e3f0fd889bf91322e3f2e3cb6be37158dbd44e3da3ed01b41bf39c80abfa6cc38beaea0e9bec689283e20e499bd4405a53e525a4d3faee0673f9fe72cbf101155bf9ea24bbe1cd1c0be9ff18bbe07cc2cbfa86cdebe788030bf9e93793fe9c76dbfd6169dbe4fba923f258e933eb942863ea85ce23f661b31bd66ee32be1bc47abffd11bebe04b8773f442214409e1f69bf127c363f283e663f54b93abfd75395bfd3fc413e5680ad3e6e0326bf8f56913fcff3103eb383263edd546c3f218e573f97a27e3e2a9ef93eeb6617bf30d3b93febce3cbe0bacb3bef73fab3e6dada03f968ddabfb611403ff716f4bf824870bfc4285bbd617c8a3efad0193fbee5573e6aaf6a3f348493beb9fff23d17fb1d3f5d9af53e5efb8a3e90ca1fbf7b301f3e72f7a8bee105cdbef08512bf9865dabfd756bb3fdeb0a63fc04592bd77f6bebf40af3dbf7889113fb03866be43178cbe8e4512be286f83bf04594fbeec3826be2f9597bfe413b5bf563862bfbc10adbfa429bebfd0b9933c70439f3ed2f7283f97df0c3fb767fdbe903f1abf82a7d43f75c9d53e9393133f9f3b743f6f8ee43e4214753fc98b0cbf6a03af3f6433b53f6054f73b3ee9a2bffbf2f33f401710bc99269bbe9f70ea3de7989fbffef9173e8aa1b1bd802427be8c2286beff04b0be074dbbbf3fc5163fac0e8cbf7fc89c3f8e1814bed437ca3fafcda43f2e31893eecf0b2be459c213edc3d6cbfc5cbfc3ef65699bebf23153e7e2801bfffb6303fa8d558bf7f888f3f0637623fa76124be586b62be4395973f828242be917730bfcce3f03ebf35bd3daa5117be688bc43f1eb7933e262186bff83a873f6230083fb998423f47f8bd3e1f7cdc3e23589c3ff16635bf6992913fe8a587bc1af6eebfae35bd3dc92adc3fa6ff76bf76229b3ea41cddbfe6951b3fd260c1be276bb53e4a4cd2be723501c0ef70813f3e3716bf14b63c3f1e73833fce43ccbe0d4a26bf8aed433f546aafbe4d5891bdb0847e3f1f2ec0be485b283ea75f40bfb16bb73fb765c9bf8c4f913fb679024040ff3ebfaf92dc3f14eff33dbafbe5bf034f213f5261453ef2f012be176a93bfae515abeba9da7be61b8ebbf005091bed3cf8ebf9a10f7bf8c8d9dbf8f8880bdb81956bfba6883bf6f398cbf45d745bfa3fe4cbe4a7521bf3ccad1bfadc8113f386268bee29514bf1ced29bf62d44b3fee4a40bfc6dbfb3e9b29153d0520e73f20fa9f3de28f683fd8dc0ac00e29143fff75e43fe3f8023f6cd62e3f7eac853efe4535bf4335193f60c20ebf69efd13e309845bf045190bfce91f63d50d3ef3f059470bff675b73e	2026-04-03 13:18:01.165	2026-04-15 07:50:57.89076	\N
det-2937743489808	missing_person	Munir	Detected at 2026-04-07 10:07:50	42	Live Engine	missing_person	\N	["/uploads/af212e94-8c7b-4a39-bf1f-c1d4be062ae5.jpeg"]	detected	["cam-4c261426", "cam-cb940588"]	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	\N	null	[{"id": "09b06a27-bbca-4f64-9c8f-1f45bba1d588", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:20:17.470465", "snapshotUrl": "/uploads/3c0f1e04-e368-41cf-bfed-cd4ef57d3722.jpg"}, {"id": "50752c64-d381-4615-92aa-c050e5ce768f", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:20:23.107795", "snapshotUrl": "/uploads/dfae3bd6-bf06-4076-b6c8-bd7c8c525a36.jpg"}, {"id": "31b039d9-d0f4-40a2-86a2-d9ab0d903bc4", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:20:28.318255", "snapshotUrl": "/uploads/c392b3a5-6ebb-422b-b0a1-776b95903dca.jpg"}, {"id": "60145917-6127-4a70-b00d-5fb9d8c528ce", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:20:36.245526", "snapshotUrl": "/uploads/07b5df41-ed17-473d-b831-d7ce64a5a884.jpg"}, {"id": "7a7f4507-bfd3-478b-8098-d882e081729a", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:20:41.533451", "snapshotUrl": "/uploads/655e75e5-dd58-4920-8a8e-63bfb7aa8633.jpg"}, {"id": "5e8399fa-2816-44ee-84ac-e139d72812d4", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:11.598722", "snapshotUrl": "/uploads/78c6b45c-a89d-461e-a2d4-40e8428ca133.jpg"}, {"id": "c0f82927-6f38-40ff-8f3d-123f44dfbd3c", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:19.936062", "snapshotUrl": "/uploads/324bd0ec-57b2-450e-9d95-5eecb9995b52.jpg"}, {"id": "4ec94b4f-a846-4130-8504-3c0ce81f5904", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:24.915164", "snapshotUrl": "/uploads/eb1191d9-cd06-4d17-9a6c-27b978477c00.jpg"}, {"id": "52493e1b-2213-4b12-95d8-2e86257b4f08", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:29.962528", "snapshotUrl": "/uploads/3c8269b8-2bbc-4cb1-91c6-25f2efc64d11.jpg"}, {"id": "53237c76-26a7-415a-9d92-5f431641fb6b", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:35.881595", "snapshotUrl": "/uploads/da69e1db-1a6a-4e51-8259-f268e0945d54.jpg"}, {"id": "ccd8f39c-d468-4d92-a0b4-55d53c4296c2", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:41.658663", "snapshotUrl": "/uploads/6fc5c13f-0303-4789-89ef-4d7130fabeac.jpg"}, {"id": "701f6953-87bd-481a-ad5d-54be0aa004c2", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:21:47.075669", "snapshotUrl": "/uploads/63a391c2-557b-4ef5-9c11-15f584ce810d.jpg"}, {"id": "f5ffa504-4d8a-40d6-b005-35e25a8e4bf8", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:31:47.514821", "snapshotUrl": "/uploads/1595c36a-ddcc-49ef-905a-0fd51b74ae68.jpg"}, {"id": "a0d9d378-46f5-4a2c-86ca-bf0c375c74c9", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:31:53.610564", "snapshotUrl": "/uploads/1c220b8c-8aa3-4f75-8bdf-4bad9ba7185f.jpg"}, {"id": "2e40daad-b1eb-4e08-88b1-cc86a66e33f2", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:34:38.542848", "snapshotUrl": "/uploads/33039380-1dba-4922-84e2-586b8f004429.jpg"}, {"id": "890369a3-edb4-4fb7-aff9-951862b622e8", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:34:45.524356", "snapshotUrl": "/uploads/395350d3-7b3c-4ec4-9128-083a9a965490.jpg"}, {"id": "e3e79c9f-67c2-4768-8db8-09555b2ce30d", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T09:58:11.351964", "snapshotUrl": "/uploads/124a024b-a6a4-4dd6-842b-f95399018d16.jpg"}, {"id": "a7dcc515-27fc-4f19-83b1-06dfdfba2792", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T09:58:33.233874", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775458713/800/450"}, {"id": "7b1121a1-8bac-434d-baee-e1182010030a", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T09:59:10.533830", "snapshotUrl": "https://picsum.photos/seed/cam-cb940588_1775458750/800/450"}, {"id": "64b9d5d0-5256-4d31-9507-18a3911da0fd", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:07:23.006367", "snapshotUrl": "/uploads/223544ab-55ab-49f7-9a84-6bb3de5f558e.jpg"}, {"id": "97200368-f343-4d10-8513-3b0a8532eb47", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:07:38.774649", "snapshotUrl": "/uploads/9453501b-509d-4b38-8b38-1c62a08f0894.jpg"}, {"id": "8c225576-4d27-49ae-a2e0-8009d80a8702", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-06T13:08:10.490000", "snapshotUrl": "/uploads/ff624048-b3e9-4b13-a483-26e3a2ed4368.jpg"}, {"id": "99db8882-b945-4416-a914-bfce142976bd", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:38:09.746723", "snapshotUrl": "/uploads/869ef39b-b2b0-432d-9c5c-6e2708542dd1.jpg", "snapshotUrls": ["/uploads/869ef39b-b2b0-432d-9c5c-6e2708542dd1.jpg", "/uploads/8fba85b8-ca66-48b5-92ca-db8c3b46aac7.jpg", "/uploads/71ede0a6-804a-4830-a011-d06cf0a6adf1.jpg"]}, {"id": "6d84a329-3fa5-47d7-9bb9-d9cd6dccb677", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T07:06:35.403035", "snapshotUrl": "/uploads/9f8144a9-6b81-4430-8b69-33c91d41235b.jpg", "snapshotUrls": ["/uploads/9f8144a9-6b81-4430-8b69-33c91d41235b.jpg", "/uploads/165ec4f4-4935-4a99-a2d4-1ddab2582baa.jpg"]}]	\N	\N	\N	comp-f5686e69-8379-4037-9bce-aa658ab27539	pending	t	\N	\N	\\x8fcb62bf1890a3bfc12d0d40dea71ebf0b209f3f141db5be3cd380bf776661bf2c7ce73d314b96bf4cc6c9bc898f74bffbadb33fc8a947bd167a773e6aebc4bfd5fbebbe7366773e6da73a3fdaccf5bf92ad963e6423e23da83fed3dab46b83e4880b43fd3e8e43f2668b63d857e323f3a5fd23e88c230bdc99139bf500b3ebc8182cb3da24e84be91cf1640968ea23fa3e9053ea8f69abfe0018ebf7a683f3e207b93be362e073fd26d003f556e3e402a582bbf0d307b3f7f4b26bfe43bc1bf707362bf3a3749bf17f4d6bf30e0c23db656563e43098f3f74b9fabefd6b4c3fbcd45b3feda1863fe0513040a467f53d175d2d3f8883a9bf75e705bf6f59c5bfe41f1abf5319d23ef6d85fbf975fd9bf69f4253e7610af3e835b3d3f2684bfbf954e383f14fb763f83d426beed70633fbcb2653f42b648be169299be7cd61fbe84f2d73ee4e2dfbc52c284bffecdcbbe2c45f73e484391bf06c8b3bf30ded03ca37d35bfb9a591be68c03fbee94386bedacc113daa6ae5bebffe0ebfdd2b97bf72b822bf198bbd3e481d12bf5aae5b3f86872cbf3e661f3f3a622fbe9fe2a9bf8810ed3f15824bbf37405abfddbfddbd09d92f3f1eca4ebf4f4bab3fdd8f393fc3bcda3fbeca373f259a533fd38d6a3ffed6edbfbd9c9d3f6ab9183f684f0d3f103b1a3cf31990bfc06885bffe70a93e0534c3bf0a8df33f0fa9d4be10535abdb5688abe9b9da83d12fba83fa6932d3fb35cfdbfd902c93ed6a6b63d7bc84fbf58989c3ffb8bd83f7dd9d2bdc03396be8d58953f9e26593e8e24c03f6dc362bfd30b423fc7c68b3e0446903fd6b7193fe15c623fa4b41dbf3cf1a63f087c293f5ad2d53ecb91fa3f2546293f034d423f0e9909c014098cbfe5fcb53f05be74bf7f41ef3d5215b8be2c6735bf9927f53e7052633cbfb687bed22f653fefb30a3eb26acdbefcff513fa6e727bf1ec993bf8e9c8e3f4b79e13e5f34c5bf92c7e2bfadf00bbf4a7396bfc49bd6be4ab7b83f00abe13b863b9c3e549c2e3f1c2d903f8ae294bf8d59eb3fc91dcebe7fef8ebf87d5db3eb59303409ae0ad3fdf9f5d3f9ccd6e3f086caa3eb6039dbf6df80c40fe8ff43f24972f3fd7508bbf51ff1e3d989061be7ea3d93e211dc0bef915b9bf175a13bf66782f3e5f9755c04859ac3e741138bf8a6a9ebf677f47beabd079bf63fc033e39b504bfda9ed5be752bb5bfc6f9633ffa4d8abfe389f3bee8547b3f0cd7aa3e460c63beabb759bf5a5daebec3a59a3fb2b319bf400b27bf2386923f1292323f7073273cb42305bfe06d07bfe4da3c3f054b99bf90b9ad3ec0e82c3f761b773e41bf9bbf55c2863f625e69bf8082ddbe97e1e93eda1a4e3d9e0e853dba0e4c3f799932bfed29d0bfd8783e3e8fcf55be3d7f20408785ae3fe18e0c40bb818abe22e9d63d0eb789bf2c7d2ebf9ba811bf41aa2a3f6ce9fd3e5184a33f2134213f17bcc43f6b8d7b3f3cb60d40e6ee4bbfc2174dbf43b4a53f99cc833e8e37f9be90d8833f02400240d6fc4e3d6cbe8d3fc9800f3fb08e003f65d1b6bf1e9f7e3fe6acb8be8574823fb6c9aabf053487bfaa1f30bf3d7e1fbf484d1c3ee43b95bfc1dba43f2d8e90bffca8473eeed73f3f8601ba3f83e5603e1c11c53ef417fc3e6ab10c3f14c959bfd05a3cbd91b1e1bf86f84abfe4be653fc261253f96981ebfbfd7d53e38be473e524bb3bfc2f17cbf21a2adbf9ef35b3f0796194067ce7dbffe1129bfbd7455bfda29cabecfcbcf3d7ad96f3f8e2cbdbb2b445a3f51118ebf1870d73f149abcbec117c8bfecf79cbf34875b3f5e49ea3d7301ba3f4104e9bf2c7163be602b4d3c3edbaa3eb893e73e611fe2bde2b75dbff8546bbe29aa86bfd408a23f0d9aa93f2c722a3e0479833fd15c0540b5e227bfa506a6bd84b65cbfb2a6f2be267ccb3f46d2d0be9aa4a9beff4d8cbf646a793df1c7563f18f72e3f7b8968bfbc1f193f5e9a9a3f6b30a7bfe2a1b93fd5a0b0bff3664b3f8dbf493fdd16b4bef3058c3fe4ea95bf086bf5beb1e524bff9074ebfbe4fd23f5d5a9a3e4e0bb53f486ab23e4ae32fbf2550d33ed4124bbe0b2cc4be8ac82d3fa9f799bf9cf68cbe58e124bf64bf693e424aa4be5b3bb6be1e01bebfc3d91cbf339e1abf6c94b9bfe743f0bef7146c3fc00e133f16c368bf22b617beca78a9bde1ab07bfd55e913f6defb1bf2a510abe343bc8becf3d70bfa1c683bf7dc0053f8e851a3f2b3d6fbf40944b3fc6a4b33f5370303efcb8c63e87a9243e0914d6bfe89b9c3f240015bfa752443f057115bf96008cbf2f129e3d93152f3f33bbb33f8c84b7bfcd504fbe31490b3fb6ae5abf24bc963e7a031c3edabd0f4062f5913f5457b03f7f66873f646b82bf0e6223bec65d70bf46bc6b3dd60c68bffa93adbeac7b88be414e0ac0bfcc843e76e89e3eccf837bfa0711dbc179fa3bf363dfd3e270e46bf7a65993f88f4b4bed0243d3ff7d3b3bfa2fd00bf7f98b63e85ef0abda85356bf0c7eeb3cfb6d4cbf7a0cdb3d7eef81bfaee9e1be3ea694bf750fc6bd7f14af3f9543a1bff29091bfc4f696be71f734bf00147fb6d8ffe7bf14e855bf4474c63f573019bdd6c6433f862811bf830bd63eff3366be425b393fdd48d83d790ed43e8fc6b8bed4cac93e79415fbf3998cd3f00dd12bfb294a7bf20f3663f822461bf800a0ebf0db49f3f99bcf2bfc2a90abfdc50b43fd24ca3beec5583bca933d13d7c34a83e58d7163f05d24dbf0e031cbfad3da9befc9a93bfe82c5bbf8e555d3f3153003f7fc91640335fab3e6a3e0640c14ae6bf705675bf7f4f91bf0af80dbfb65e46bf1dc139bd24fa6c3ed7d922bf220dfc3fa20f37be94209f3d2892053f3bee16c0e266a83f3d4b9bbe	2026-04-03 13:16:35.263203	2026-04-07 07:07:48.809993	\N
det-2936810159984	vehicle	v8	a car	\N	\N	criminal	\N	[]	detected	["cam-4c261426"]	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	\N	null	[{"id": "a18f6e73-7c31-4049-9347-bc4d2744d5f9", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:45:50.062971", "snapshotUrl": "/uploads/4ea6ef14-db57-48b2-bdff-5bbda6937995.jpg"}, {"id": "33fd19fa-1d4f-4849-866c-b4c5f5737101", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:50:08.098907", "snapshotUrl": "/uploads/1eef9114-5763-4ff0-94ce-e3fbb39a9687.jpg"}, {"id": "c49c97ed-ccb2-4ac1-8e36-f826d6c6c802", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:50:09.200391", "snapshotUrl": "/uploads/dc30d62d-8d6d-422a-92e0-9cf58b50f33e.jpg"}]	31106	3	\N	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	pending	f	\N	\N	\N	2026-04-03 13:44:32.744496	2026-04-03 13:50:09.202084	\N
det-2095330999376	criminal	Eyosi Bio	Detected at 2026-04-15 17:04:45	21	Live Engine	criminal	Terrorism	["/uploads/ea0e2144-9db4-46ab-9b37-5e17782685b5.jpg"]	detected	["cam-4c261426", "cam-cb940588"]	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	comp-f5686e69-8379-4037-9bce-aa658ab27539	\N	null	[{"id": "92f0aa80-a031-4997-bf93-a33a9d20dc9b", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T09:19:24.297500", "snapshotUrl": "/uploads/6fcf5ed4-6b6d-48f4-b203-75495cceb66e.jpg"}, {"id": "10f755c6-6816-4dbf-8c9c-39d718c0e364", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T12:47:11.236430", "snapshotUrl": "/uploads/b7933391-17a3-42d1-a465-b3409484d4df.jpg"}, {"id": "517760d2-4673-41e0-a499-131cb5a14ccc", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T12:47:56.756467", "snapshotUrl": "/uploads/25ad8dce-d6d2-4c32-afdf-5c8b07fd781b.jpg"}, {"id": "af96be97-2c4b-4cde-a4b8-49cb3d9cefff", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T12:54:57.556154", "snapshotUrl": "/uploads/213ce031-fd0b-44d4-850a-5600f0b9f743.jpg"}, {"id": "b719ec93-37e2-4cdb-ae2b-55e28a687756", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:05:53.575452", "snapshotUrl": "/uploads/cd754099-62d7-4fca-8b7f-74ce358ecadf.jpg"}, {"id": "9715133c-6649-45bb-8a07-b4149f7ac0ff", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:13:27.351281", "snapshotUrl": "/uploads/818fe29a-9432-4059-bfc7-a40bac1451f6.jpg"}, {"id": "6e1c690c-6f06-4be9-8805-15eacdf36e73", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:14:58.145413", "snapshotUrl": "/uploads/d8cf1101-ddab-4548-af09-5412c2e9ed47.jpg"}, {"id": "a272d083-e14d-4471-a8dd-a3799560c25b", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:15:44.675143", "snapshotUrl": "/uploads/9fd5ff58-6209-424f-963c-dcbcfeb49b38.jpg"}, {"id": "cb3ababa-0272-45b1-86d9-59192fa0492c", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-06T13:38:06.271271", "snapshotUrl": "/uploads/fa157928-3d7e-42d1-be7f-6379a9d94c82.jpg", "snapshotUrls": ["/uploads/fa157928-3d7e-42d1-be7f-6379a9d94c82.jpg"]}, {"id": "c39d69a0-99a8-4cd4-b05f-ee21183e2c74", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T07:07:50.708962", "snapshotUrl": "/uploads/349241d5-f4c6-4c36-af04-db02bbe4bb72.jpg", "snapshotUrls": ["/uploads/349241d5-f4c6-4c36-af04-db02bbe4bb72.jpg"]}, {"id": "8257b7eb-3dab-42c3-9602-c7f2e61cd5c5", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T07:28:00.795031", "snapshotUrl": "/uploads/1e189773-e480-4ca1-9024-a6254cc926c5.jpg", "snapshotUrls": ["/uploads/1e189773-e480-4ca1-9024-a6254cc926c5.jpg"]}, {"id": "6853e6dd-ee26-456e-8718-793fdb36c085", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-07T07:28:12.688795", "snapshotUrl": "/uploads/3a3320be-e525-4eee-897f-07c65cbf6438.jpg", "snapshotUrls": ["/uploads/3a3320be-e525-4eee-897f-07c65cbf6438.jpg"]}, {"id": "a4d02a56-6c80-4b53-a2e4-9d869214a6b5", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T07:41:42.141753", "snapshotUrl": "/uploads/259f9845-d867-4670-af11-dc3d6558f108.jpg", "snapshotUrls": ["/uploads/259f9845-d867-4670-af11-dc3d6558f108.jpg", "/uploads/9f5f7281-3ff2-4455-90d1-1ba493f96972.jpg"]}, {"id": "e4755687-814e-45d5-be6e-b659ab26ece6", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-07T14:12:36.492416", "snapshotUrl": "/uploads/0574496c-603d-4abe-981d-93bd4e6036ac.jpg", "snapshotUrls": ["/uploads/0574496c-603d-4abe-981d-93bd4e6036ac.jpg"]}, {"id": "b5891f98-2bb7-4af0-bf02-fa3ae6cea725", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-15T08:37:16.905374", "snapshotUrl": "/uploads/b066f4a4-d654-461f-af13-cd30f7cd62de.jpg", "snapshotUrls": ["/uploads/b066f4a4-d654-461f-af13-cd30f7cd62de.jpg"]}, {"id": "9e5d4061-7452-4124-9556-0edab35bd908", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-15T10:40:27.640916", "snapshotUrl": "/uploads/f41c28de-0f61-48c3-bc3b-c5379a163202.jpg", "snapshotUrls": ["/uploads/f41c28de-0f61-48c3-bc3b-c5379a163202.jpg", "/uploads/72df2066-e059-48ea-92a3-4b0ad26b7531.jpg"]}, {"id": "217bb7d2-f1bf-4658-aca1-8b1db66bf423", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-15T12:40:51.035734", "snapshotUrl": "/uploads/8d2d9870-47dc-4b9d-8280-82c4240115fc.jpg", "snapshotUrls": ["/uploads/8d2d9870-47dc-4b9d-8280-82c4240115fc.jpg", "/uploads/26ad79b8-9869-4182-a075-eeec3fe1f50d.jpg"]}, {"id": "b67c929d-3dc2-4fc4-b44a-94fe36454ecb", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-15T14:02:23.843806", "snapshotUrl": "/uploads/97e203ba-9b9f-4410-b071-1dddecef2fca.jpg", "snapshotUrls": ["/uploads/97e203ba-9b9f-4410-b071-1dddecef2fca.jpg", "/uploads/9dfb561e-1141-43f7-9ee9-d6bc239d04a2.jpg", "/uploads/3fe8d9e3-a6eb-48f3-9870-b28985d5bb79.jpg"]}]	\N	\N	\N	comp-f5686e69-8379-4037-9bce-aa658ab27539	pending	t	\N	\N	\\x382c3fbe7a40b1bf366287bf625dc3bf488665bc980da3be239a2ebf5fc3dbbe229793bf243dccbdfc5c7dbe2034103fe2f972bfbea8f63e4a9a03beb25b04bfedf840bdfc0f5d3f3009c33cff0d3d3d1c5c68bfaec7cd3f754473bf008a73bf7636adbd8b79ffbe53ad27bfaeb489bef105b3bf0026a2b97191953f22375e3f9e303b3f9d885d3e9f4ebb3ff4df373ee5336b3f86fefe3cbe310abff66aa63f1712573fe300433f7e8704bfc523debec6bc66bf5921a3bfc2d9373f9e612dbf8a17f0be53aebebe60e8ffbe5943053f92cfbd3f1375943f9de6853f6c03ce3f303e00be22889e3f1d35e33ede7abfbfe465a1bf899107c018a8afbf8857823f3557453f831cbcbf1598a53e05d529bf9d08d6bf56b31c3f4a8286be53a265be352607bf4df796bfaae427bf7abd94bf9c850dbf64e713bf0829163f4696103fc09e0d40fde240bfc1d8803fbd02e2bd42e6c2be30ac65bf5a6889bf74d3713d59c396bfba10b33ff538c23eda68c0be1ca477bf570c4fbf653e79bf7a7edfbf95ef13c00802ba3ff2d9fabdc62d90bfb07994bff1f6883f28a07ebeea5e36bfa4ba453f607141bf779c213f7bbf91bf27d7083fc24a05bed5d16d3ff6c3b03e33a645bfbc03cebdb0fd833f3a4c4bbfa941863e0769b63de835943e8a40de3d0fe3ab3fd11587bf23a21240d38916c063dbbfbffc961c3f6c0a5fbfeba2373f2aef413e6ff2d0bfb38209c0e6430f40abd3cbbf3797d1becb9b8ebf8b6533bf9965bc3e2d760abf146b8c3ec248c43f9e82c2bedcc4113dac91aebf4c03dc3fd336c03fc047953f705a8c3f0267753f15a81f400e3d46bf4050adbf8c279c3fc84246bfbc582b3f1c16433fa03e0a40dd36d3bfa2e8cbbecedf8f3f2692fa3dec4e033eae0731bffe61b5bfdef2893e72df4f3f1e1b7f3faddeac3f685c753ffcd7cdbf91091bbf291347bed445b13e8d747b3f1e6093bfc68d3bbf12e07abf8cef8f3e32f83e3fc1420940d3baa4bfaa0bc1bf8f600040225eeb3ec265c73e02cf1ebff84b093ff3c1e33f9414263dae65503e2041e5bef0fe903e8d8d573fa7d6013fd0c7b43ecb4948bdf4f255bfe0fab1bcb059fcbee18ad93dc877bebd3a6043bf6c3a16c030d68bbdd681d8bdd84cf3bf98c600bf61e74cbf1ffe123f11cf143f083191bfbf1930be7f35833ee02259bd6e0cd23fecf41abe0ae1bc3f966f8d3f5d0836c0154287bf5b51363e9a9d8abf715791bf44cf333e4679afbed4c6be3f960dcb3ff2d597be251dbd3edced8d3ea9f902c04cd20a3f4af529c041a46c3f9bc4bcbfb56a84bef092b13f702e3f3f64bf833ffad4bcbf86fea2bf0bbf2dc0c3aa953e9ed9953f9c2d163c23a9edbe01e5b2bf70ef453f529082bef9525abe98d8c03e382a1ebeb223053fe67c633f0fa4efbeec6a7cbf6c91863e457427bf25b52abfaf63203f4016eabcdf7a33bf1aa3963fefaf92bee6a71f3df76e3abef02c62bf0db522bf3c23ad3e5c55d1beaeb3113fe0f92f3fd168febeea22d13db9e8cdbf1190e33e2e39bfbf4ecedcbf2cdd26be69fb08bfad18093f7ffa04bfd4263c3efa3ebb3fca41db3ecff78fbe28a2cbbeef6676bfb8b0dcbc88ff5e3f8bd085bf84e5da3fab2c8bbf51a2c6beddbc51bfbec99abf481828bfacacd13e486e6bbe17d8993fe093883fae83e7bfaaa9083dd5da8dbe84afa8bfb2b45d3eb88b103eef84253fd0c1c63c78e5efbf8cfe383fe9f6413f4e0b233f458badbe84a7a93f63e640bfbcfb5dbf7ceb993e1ebb8dbf217743bf79217ebfbc9c0cc0b8c3f8bddfe3973e80f1823f56f006bf5758983fea50a1be57ad41bf7afb01c0d3d088bf1fa8e3be3a7e4c3ec9f3e33fee0664bfde37e7be334d8cbe82d68a3f78b4fbbd9c3927bf43868abf474088be3f7831be4691643f703752bf863382bf46cb0e3e298a6e3fc8a2ab3f1e0bce3f679109bf930e5abff7a91c4012452cbf03f1cd3f205097be0a27b73e243a803f764855be7288b63fd790703f1e2534bea0e794bfc39d0b3ef18f0e3f42cba1bdea26adbfabbd97bfaffb91bea22a83be06d9c4be5cdb7b3f2895a23eae73ff3e702162bca0971b3df9d0073f314e93bf9ce2bf3e64a89cbfc773f0bf7d4c9ebfb2dfbdbd6803163f6cf4c4bd4043693fecd3de3e4ca7e7bff32b0ac0e30deebf1213bc3c31d2f6bf2fa4083fa67ae0be10055ebdc8fa7dbc2914204037928e3e5c7528c0a20d80be4d643b3f3534283fd3b201bfdc8d433ffc6b003ef228693f47510a3f09d0c4bf078402bf070ed7bf853fa33f831ea53f9a485e3fe1a3f0becb1aba3e42dceb3e08b7813e0028b43eeb0899be0a0601beb20d423e2284983e939814bf1911903ed1a6b6bf000974bfe601d13e540fc8be313cfbbe71c39abf7ee4c83ee4854cbfee84a4bfd0d78a3d3312bf3f855b863f360a19bf9de5913fbaef4e3f9f20f43fc3cca8bf5e353b3f52c4393f5a38f43f9e59b1bd5866813c99aa24bfc4e478bf8e50003f8deb373fb2968dbfd498d53e2f4aa93f19c959bfc2b0dfbf0fbeb53e3e39f13e2eba10bfe6b9b7bf64e4a1bf64844ebf8dc0a23f50a7be3f464e9dbf0019773f9486383f44cd9c3cb3f00ebf1042f73feaa4d63ec67a3dbfc474afbfc4e127be4330fbbebbbe3dbfeaa06f3f30035dbc2e5588bf3c60d9bf0eddc2bf16a19bbf908832bffea16dbf7411aa3d40a4ff3e37d423bf3ac68cbd008daa3f2b519e3ffe278b3e8c849c3f0fbc683fd7bf8cbec77e913f29219b3f5209014008b0eb3f4e719d3f6ebf9abe00b3babc3000ee3de8c4753facd8bdbf1e938fbfd8f3f03f9ee895be6af9573ff602493fa50fc93e7ac62f3fcd3fb3bee9ec8b3f49b10540	2026-04-06 09:18:23.921642	2026-04-15 14:04:37.582488	\N
det-2936810919792	vehicle	Vitz	a car	\N	\N	missing_person	\N	[]	detected	["cam-4c261426", "cam-cb940588"]	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	\N	null	[{"id": "fe39c212-1a6f-47dc-a8c2-e50996b6e7e0", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:24.338535", "snapshotUrl": "/uploads/b4ff3aeb-c501-4d50-890c-e25979fb5b0c.jpg"}, {"id": "8264fa7c-4935-4551-8011-f00c90293e25", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:26.154536", "snapshotUrl": "/uploads/16a4211c-5c49-4b9b-9e7e-28df5d925083.jpg"}, {"id": "70d86835-ebf8-40e8-b862-57caeaf4bb27", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:27.320363", "snapshotUrl": "/uploads/09eb9a36-3a89-49e3-b82e-9f5566855d52.jpg"}, {"id": "3ed28697-cd21-454d-8997-7ed586fbefee", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:34.925619", "snapshotUrl": "/uploads/4fb7aff5-dcf0-465d-8872-602f05405796.jpg"}, {"id": "c6545026-b44c-4468-b71a-86d2b5e1d080", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:38.986723", "snapshotUrl": "/uploads/92658439-baf9-430d-a24c-83ec61af0d33.jpg"}, {"id": "8d3bc991-9738-43a8-a923-69acc3577635", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:42.080941", "snapshotUrl": "/uploads/46c4fa87-a87b-464f-bebc-b2ec599ddbf8.jpg"}, {"id": "3ae586db-5a8a-436e-a447-dc646b30179c", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:43.562335", "snapshotUrl": "/uploads/683e5741-87e4-4a9e-be53-1d95157dc4cc.jpg"}, {"id": "d7a88216-680a-4956-a1e6-8d3edc6666ea", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:45.721827", "snapshotUrl": "/uploads/76cf2a55-7f5a-433a-96fd-08158260bcd6.jpg"}, {"id": "9df36c6e-3c2d-4c00-99e9-cc4694ee18c2", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-03T13:57:51.282046", "snapshotUrl": "/uploads/c71b3d3b-74ff-40fb-aecb-3826e9b51036.jpg"}, {"id": "6c5bb082-2536-4bb5-a9b7-05fd8929b67b", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T08:06:54.247245", "snapshotUrl": "/uploads/12354ec9-ca7f-42f1-856c-73b8e29ce3b1.jpg", "snapshotUrls": ["/uploads/12354ec9-ca7f-42f1-856c-73b8e29ce3b1.jpg"]}, {"id": "4ce89ddb-9c8a-40e4-be9a-442e0e0b47df", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-07T08:43:58.243730", "snapshotUrl": "/uploads/84738a07-876b-4b36-ae76-953e05aca276.jpg", "snapshotUrls": ["/uploads/84738a07-876b-4b36-ae76-953e05aca276.jpg"]}, {"id": "b17156c7-a86a-4bc8-9359-d67384a8c838", "cameraId": "cam-cb940588", "cameraName": "Parking Lot Exit", "timestamp": "2026-04-07T13:18:53.040494", "snapshotUrl": "/uploads/eb7d318c-16d8-42d2-80c2-d7b56b7ba62c.jpg", "snapshotUrls": ["/uploads/eb7d318c-16d8-42d2-80c2-d7b56b7ba62c.jpg", "/uploads/9950ae60-2392-421f-9d4c-a98803dc2344.jpg", "/uploads/39360141-99ff-4eab-8f66-2ea240305353.jpg", "/uploads/62c42e12-acb4-444a-822d-ffa7e79fc118.jpg"]}]	94529	2	\N	comp-f5686e69-8379-4037-9bce-aa658ab27539	pending	t	\N	\N	\N	2026-04-03 13:43:20.810321	2026-04-07 13:20:58.306747	\N
det-1887186707760	vehicle	carrrrrr	rr	\N	\N	missing_person	\N	[]	detected	["cam-4c261426"]	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	\N	null	[{"id": "2fbf7eb6-aaa8-422d-84ef-7e0b26b0c101", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-15T12:23:08.339042", "snapshotUrl": "/uploads/43534af8-d5a4-4189-b7a9-03d77a5c66ad.jpg", "snapshotUrls": ["/uploads/43534af8-d5a4-4189-b7a9-03d77a5c66ad.jpg"]}, {"id": "4340a8e7-ce26-4b1d-bc26-d9f839728d89", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-15T12:29:14.654578", "snapshotUrl": "https://picsum.photos/seed/cam-4c261426_1776245354/800/450", "snapshotUrls": ["https://picsum.photos/seed/cam-4c261426_1776245354/800/450"]}, {"id": "ad3153cd-e579-4ced-8599-34e7ad558ed4", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-15T12:51:22.157991", "snapshotUrl": "https://picsum.photos/seed/cam-4c261426_1776246682/800/450", "snapshotUrls": ["https://picsum.photos/seed/cam-4c261426_1776246682/800/450"]}, {"id": "b44a12bd-f839-4cba-8393-449a1ccfa85f", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-15T13:02:58.010824", "snapshotUrl": "https://picsum.photos/seed/cam-4c261426_1776247378/800/450", "snapshotUrls": ["https://picsum.photos/seed/cam-4c261426_1776247378/800/450", "/uploads/235c36f2-f4c8-4e51-b777-39b1665a1124.jpg", "https://picsum.photos/seed/cam-4c261426_1776247396/800/450"]}, {"id": "e6195c80-e3c7-4933-aa34-bf921a95885f", "cameraId": "cam-4c261426", "cameraName": "Main Entrance Camera", "timestamp": "2026-04-15T13:15:13.165609", "snapshotUrl": "/uploads/f0d25245-c00f-43c9-842f-b0ec33d06135.jpg", "snapshotUrls": ["/uploads/f0d25245-c00f-43c9-842f-b0ec33d06135.jpg"]}]	12345	2	\N	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	pending	t	\N	\N	\N	2026-04-15 12:22:54.144208	2026-04-15 13:15:13.174208	f
\.


--
-- Data for Name: formtemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formtemplate (id, name, description, fields, is_active, organization_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (id, type, title, message, read, action_url, user_id, created_at, updated_at) FROM stdin;
051ed454-7acc-4a65-a425-9f3c65b4c6fe	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 11:09:04.697778	2026-04-03 11:16:15.960428
d51e238f-94e2-4607-aee0-421b91759957	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:08:13.119712	2026-04-03 12:12:10.460314
5075ac81-03f1-4d12-8ea0-d44f654e7ff1	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:20:17.473741	2026-04-03 13:20:17.473743
0d497741-b048-44fa-bac1-944835aec331	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:20:17.473745	2026-04-03 13:20:17.473746
75d75155-a46e-4a93-ae2e-1745a70ef4de	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:20:23.109952	2026-04-03 13:20:23.109954
4280ae48-52b1-4900-b763-311ee9795ccd	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:20:23.109956	2026-04-03 13:20:23.109957
b2b2135a-af58-4da6-a82c-5368554c9b31	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:20:28.320022	2026-04-03 13:20:28.320025
5f37d784-f11b-4327-a00d-4f9135944f93	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:20:28.320027	2026-04-03 13:20:28.32003
0cfd8206-2cc3-4864-a98b-fbaabdfc732b	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:20:36.247865	2026-04-03 13:20:36.247867
e3466c18-48e7-467e-8fe2-a2abe301cabc	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:20:41.535355	2026-04-03 13:20:41.535357
fe8e9fd9-b6e2-4e05-80ca-242ea8d34cfd	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:11.601234	2026-04-03 13:21:11.601236
59e0aa22-2438-4e89-a5bd-684b0e7e5472	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:19.938057	2026-04-03 13:21:19.938058
0d249532-1851-43a0-ba3f-f2d19cca4a80	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:24.917087	2026-04-03 13:21:24.917089
af937ba0-26b6-4a4e-968d-6152145d85b0	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:29.964383	2026-04-03 13:21:29.964384
6246f847-9378-403c-89d2-261878d4b2d1	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:35.883544	2026-04-03 13:21:35.883545
d9c7bdff-ac5a-4e06-9f43-38509d41a19d	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:41.660318	2026-04-03 13:21:41.66032
7d38c0e1-d665-45f4-9577-79348aad08bb	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:21:47.078387	2026-04-03 13:21:47.078388
2dfba555-e885-4c4c-ada7-18c545566306	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:00.372701	2026-04-03 13:27:00.372702
2ec8cb65-3b09-410c-9e85-638bd6de5524	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:05.51239	2026-04-03 13:27:05.512391
74c9eb64-2fc6-466f-8aa3-bab27d05b9c4	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:47.078381	2026-04-03 13:29:27.091263
224f4271-8c15-4a4b-b204-6b5a32d19457	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:41.660314	2026-04-03 13:29:27.237974
800d283a-88f9-47b9-bd67-0767a07d583e	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:35.883539	2026-04-03 13:29:27.388329
f9be8bfa-7e06-4b65-b597-05721ede7d46	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:29.964378	2026-04-03 13:29:27.555004
e104cbe1-14c7-4c2c-83c3-3de6f1a5d219	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:24.917083	2026-04-03 13:29:27.838074
353d9207-2e1b-4dcf-add9-5c990f67a656	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:19.938053	2026-04-03 13:29:28.004768
9caf2cca-dfbc-41b4-8d29-f3673411f30b	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:21:11.601228	2026-04-03 13:29:28.153617
ad549260-897a-4604-a5ba-d87fe728c9bd	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:20:41.535351	2026-04-03 13:29:28.320357
de9e163b-1d25-46d7-8d55-5aad54e2efd9	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:20:36.247859	2026-04-03 13:29:28.457904
ac793535-93c4-40e8-88b3-79f66460b3a4	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:20:32.848593	2026-04-06 09:16:57.167946
d5a7a660-cd8b-4b84-b328-e6ba39069064	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:20:30.70023	2026-04-06 09:16:57.266953
780c0808-392e-4fb5-a7fa-6990c2b5db11	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:19:58.720245	2026-04-06 09:16:57.387844
93622c08-d7f1-4f79-85b7-676c98861904	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:19:56.880646	2026-04-06 09:16:57.497918
075c040f-3b86-4f2f-8e22-dbe4c7f3381f	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:17:27.348138	2026-04-06 09:16:57.628918
69387a31-b9ca-4d97-a99e-43ce1daef40a	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-03 12:17:25.582184	2026-04-06 09:16:57.737789
156922bc-5f18-4fad-9c8f-89a99ba2eff0	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:11.279757	2026-04-03 13:27:11.279759
9b470229-be3b-4bb6-b2d5-7e5e0b81983e	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:24.072807	2026-04-03 13:27:24.072808
1e678e1b-1ae6-4ab4-8c66-10cb25e93873	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:28:02.557363	2026-04-03 13:28:02.557364
c342d99f-5850-4e94-b157-fa0eb464ff33	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:11.279751	2026-04-03 13:29:26.458877
941119f0-030b-4d0a-8c78-7a0b041ac223	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:24.072802	2026-04-03 13:29:29.392302
e856f726-1a1b-4cd5-84c6-f43253c68200	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:28:02.557358	2026-04-03 13:29:30.268737
6437d4fe-bbf1-4102-88eb-8e1dddf69477	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:18.723957	2026-04-03 13:27:18.723958
afb5509e-b9e2-44c5-8f7c-c7162d1bfa77	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:56.949339	2026-04-03 13:27:56.94934
da7ede83-1dcc-48ad-9566-0026dab750e0	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:18.723951	2026-04-03 13:29:26.278471
5eb3d4cd-21f6-4968-97f8-ec2c15d38c3b	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:56.949334	2026-04-03 13:29:29.082525
59a6cce9-d981-4294-9544-4a61107fbc0c	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:39.669867	2026-04-03 13:27:39.669868
da73e760-9786-4e7f-b4fc-e266b945c5d9	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:28:08.301662	2026-04-03 13:28:08.301663
31bb0baa-cee6-4fc6-bdf4-a93e3bf2a04b	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:28:08.301657	2026-04-03 13:29:28.776229
4fdb7a33-3a96-4356-8c69-1b1e2f480a09	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:39.669862	2026-04-03 13:29:29.95853
1b9acf8c-2c09-4354-bd02-275e625af813	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:46.560605	2026-04-03 13:27:46.560606
370389a7-f6d1-4bbf-a786-bf0a35e0b430	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:46.5606	2026-04-03 13:29:29.230922
fe369b4f-60d6-44a9-b134-b4f1fd5eb217	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:27:51.839358	2026-04-03 13:27:51.83936
a4d3179a-dcbb-44ea-a229-b49a1fbdf216	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:05.512386	2026-04-03 13:29:26.752828
70fdac75-e63a-4158-a3e9-347f630558b5	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:00.372696	2026-04-03 13:29:26.926623
9d42f76a-9a2f-4143-a90c-c7edde673ae0	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:27:51.839353	2026-04-03 13:29:29.742439
58653c8f-5c2c-46c8-8b4a-628181a90614	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:31:43.238446	2026-04-03 13:31:43.238447
e9729f49-22a9-4764-a070-1abb6624aeae	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:31:47.517269	2026-04-03 13:31:47.517271
f5cc2195-a42e-493f-8039-8354d5a87a14	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:31:53.612136	2026-04-03 13:31:53.612137
cfed584b-82df-448d-bb45-d0c28dde8103	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:34:38.544697	2026-04-03 13:34:38.544699
092c3177-88e7-44c0-ac41-418200bf0343	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:31:43.238442	2026-04-03 13:34:38.807166
4e553493-eabd-42a8-8e50-30365e2e26c1	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:31:47.517264	2026-04-03 13:34:39.035439
642b8851-0891-4b5a-9ba7-95b01c6739d0	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:34:38.544693	2026-04-03 13:34:39.719082
88d96f6a-36cd-4e85-a195-4452be0e6004	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:34:40.453352	2026-04-03 13:34:40.453353
ca01597b-4730-4e5f-9056-3929ea84aca4	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:34:45.527308	2026-04-03 13:34:45.52731
684ee0ef-d897-4015-8fe3-6c35f56c95e5	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:34:45.5273	2026-04-03 13:35:47.680768
56ff7b1d-a11f-42d2-84f2-b4d76cf5e0a0	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:34:40.453347	2026-04-03 13:35:47.838343
ffe457f3-944d-4d0b-9421-c5bd8a56e436	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:31:53.612132	2026-04-03 13:35:48.139648
7b7e416a-4f3a-40e4-b421-27157aa8a487	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:45:50.065209	2026-04-03 13:45:50.06521
0e4e4d99-5c62-4c75-8ffd-8e2c316f712d	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:50:08.101968	2026-04-03 13:50:08.10197
8f4efb7c-42a9-4d01-8c13-915356e3035b	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:50:09.202423	2026-04-03 13:50:09.202424
4ed6c122-0e3f-40db-bced-4d865520f4f8	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:24.340372	2026-04-03 13:57:24.340373
4c1021ee-da56-4165-a4d0-f9f920c6ff73	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:26.157287	2026-04-03 13:57:26.157288
8973afac-7f29-4b6c-9219-f7bc9ce75201	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:27.323165	2026-04-03 13:57:27.323167
73235a04-005f-497a-b12e-468a8046ca22	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:34.927246	2026-04-03 13:57:34.927247
1eb5d1e0-ad1f-49b1-a77c-4721811a5bb3	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:38.988223	2026-04-03 13:57:38.988225
fd01159a-6705-42b5-8eaa-eb40bb1b298e	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:42.082944	2026-04-03 13:57:42.082945
c65a5818-7910-4ec4-896d-5449067ba64d	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:43.564751	2026-04-03 13:57:43.564753
02dd6cdf-8b07-4443-977a-da8e26ecfe84	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:42.08294	2026-04-06 13:21:45.89431
327ca6ee-ff58-4513-bd1d-b1c6e0f515a3	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:38.988219	2026-04-06 13:21:46.01333
dc24214c-2850-4bf7-bf19-3a3868e4d7de	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:34.927242	2026-04-06 13:21:46.159005
554401b4-1aef-4a2d-80de-2d493fa21a1b	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:27.323159	2026-04-06 13:21:46.2711
00940216-7959-4386-ae05-a708f562e4fa	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:26.157282	2026-04-06 13:21:46.797549
94930564-14b6-4da5-b01a-234b9f163dc4	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:24.340367	2026-04-06 13:21:47.136163
e95a24da-82b7-492d-959f-a4f94afd11e5	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:50:09.202419	2026-04-06 13:21:47.441055
9d7153be-3038-471f-bb4d-f7d9611d3cbd	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:50:08.101964	2026-04-06 13:21:47.607485
e0b1e989-63b8-4937-88e5-9ae70e6bfd78	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:45:50.065203	2026-04-06 13:21:47.794264
decdcbcd-eaef-413d-b269-ba0f2be9d843	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:45.723921	2026-04-03 13:57:45.723922
bdd350bb-5355-46af-b5a2-ae7480649fc1	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-03 13:57:51.284239	2026-04-03 13:57:51.28424
568742c4-7202-415d-adb6-5bcff1573d7c	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 09:19:24.304184	2026-04-06 09:37:08.308974
f24cc0f3-cf20-4c3a-9017-691767088a74	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-06 09:58:11.360751	2026-04-06 09:58:11.360754
4869aa0b-86b5-46fa-8533-c863f2a1e52e	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-06 09:58:33.245985	2026-04-06 09:58:33.245987
ce4f04a7-5d8b-41b8-a68e-c372ba7a926d	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-06 09:59:10.538472	2026-04-06 09:59:10.538475
f09d8e7b-68d0-4672-b123-e4f32ce5cb0d	alert	Detection Alert: Main Entrance Camera	person detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 10:09:32.804981	2026-04-06 10:09:35.989572
0b5c6bbc-1438-4c9b-825b-5fcf08a5d881	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 10:09:50.214643	2026-04-06 10:09:52.181167
eb944447-0288-481e-af25-cbd550c21423	alert	Detection Alert: Main Entrance Camera	person detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 10:07:54.806618	2026-04-06 10:09:52.587764
abe1c5e8-0dd6-45af-858a-cc88936419bb	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 10:32:46.994237	2026-04-06 10:32:55.549499
6e754a7d-d655-47cb-8a8a-34707a70475c	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 10:32:56.576793	2026-04-06 10:33:18.062517
23449d5f-376d-4f3c-90dd-e1fb53040a95	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:40:37.943132	2026-04-06 12:40:41.526631
ede8d177-9074-4631-9b2f-96e6b8278550	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:47:56.760082	2026-04-06 12:53:02.149666
3ffdb570-305f-4441-9a04-4008c50f853b	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:47:11.239158	2026-04-06 12:53:02.297641
433bf9b4-b8e2-48ca-99f6-beecca5a9d8c	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:40:42.549651	2026-04-06 12:53:02.504587
51379acf-7ba1-4c37-b2a9-01bcac069b1c	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:53:25.558603	2026-04-06 12:53:28.458839
3a8ee05c-388e-41b9-8cc0-76d870fa5190	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:53:51.663789	2026-04-06 12:53:54.681935
ddcdba0b-7062-4212-83d4-faa9ab44ec9b	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:53:32.406073	2026-04-06 12:53:56.1515
533d1613-4778-478e-902c-ccb5eb753f22	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:05:53.590734	2026-04-06 13:06:16.542044
3409239d-82ba-4e68-82a4-8f827b57e7b8	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 12:54:57.559584	2026-04-06 13:06:16.686164
8369d96c-bc78-4dc0-8787-64261f5dbd46	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:06:23.688698	2026-04-06 13:06:25.59516
bce6f607-f7c6-4ba2-9c58-50bf9020f299	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:06:32.678728	2026-04-06 13:06:36.11812
2c26bb14-7254-4324-82e1-d32aa37c3ee4	alert	Detection Alert: Parking Lot Exit	person detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:06:46.915883	2026-04-06 13:06:59.479341
ec0dd0e4-7c46-4f7c-a82c-4b7d51cde2d1	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-06 13:07:23.013692	2026-04-06 13:07:23.013695
cb651657-a2e7-481c-b155-8528c76be72a	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-06 13:07:38.776634	2026-04-06 13:07:38.776635
3c4342d8-b53c-4f73-a662-0f904df84e26	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-06 13:08:10.494944	2026-04-06 13:08:10.494946
3bbe9890-76bf-4d63-a1ce-cf0af4c0e191	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 13:07:23.013679	2026-04-06 13:21:44.969336
caa5f7b9-0042-4938-a49f-21ffeacd3e38	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 09:59:10.538461	2026-04-06 13:21:45.096652
7e39f96d-46f0-41ad-bf9f-1590d27f7fcc	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 09:58:33.24598	2026-04-06 13:21:45.257044
8e39d5a1-503c-4591-a518-6aac7152f16d	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 09:58:11.360739	2026-04-06 13:21:45.361804
8b788fdc-edea-4c7e-9faa-d023b2108bd3	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:51.284235	2026-04-06 13:21:45.503571
a19292c7-cc9a-4c95-abd2-c2227b32a293	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:45.723917	2026-04-06 13:21:45.62475
9802af61-474c-442d-8363-068aef3c99c9	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 13:08:10.49494	2026-04-06 13:21:48.01377
98d3d88b-a483-43c9-984a-bcc59e7051a3	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 13:07:38.77663	2026-04-06 13:21:48.711106
825f248e-e98d-42b9-99c3-e795ea0504a6	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:09:18.378838	2026-04-06 13:11:28.053893
0fed7231-1924-4271-92f3-2dbca2f4e548	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:15:44.677565	2026-04-06 13:20:02.098835
15701ccc-e187-43bf-9cae-12a5ac1725e9	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:14:58.148205	2026-04-06 13:20:02.696113
f68eb540-05da-48b5-b05a-f5bf141fc277	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:13:27.353788	2026-04-06 13:20:02.841007
a145ff81-7c25-4d4c-baac-03aad536d4e7	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:20:33.8991	2026-04-06 13:20:36.190106
51087591-93c8-413c-ad3f-19db590b1ddf	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:20:46.533802	2026-04-06 13:20:49.521264
2740f36d-b6fe-487f-b586-f82dcec66bae	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-03 13:57:43.564747	2026-04-06 13:21:45.752042
d8d3cf55-aa15-4eb1-993a-84eccfd954a3	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:22:43.749768	2026-04-06 13:23:16.856219
4f79bdff-aefc-4871-a17d-0011b9b5c1d9	alert	Detection Alert: Main Entrance Camera	missing_person detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-06 13:38:09.772857	2026-04-06 13:38:09.77286
56e465e0-faff-402b-8f24-e95c586bfdc3	alert	Detection Alert: Main Entrance Camera	missing_person detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-06 13:38:09.772862	2026-04-06 13:38:09.772863
d6383282-1822-47b2-9d2e-51fece5b891c	alert	Detection Alert: Main Entrance Camera	missing_person detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-07 07:06:35.415452	2026-04-07 07:06:35.415455
1ff10241-8c7e-477d-b950-2bc0ba04afd6	alert	Detection Alert: Main Entrance Camera	missing_person detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-07 07:06:35.415458	2026-04-07 07:06:35.415459
84a3f1f2-6456-427c-b8ff-1b35ea2de6f5	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 07:41:42.14471	2026-04-07 07:45:42.854727
94ea2794-1aef-462c-816c-6ae72ddaba3a	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 07:28:12.692243	2026-04-07 07:45:42.986745
4513a157-cc7a-40e8-970e-325be95e90a7	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 07:28:00.797474	2026-04-07 07:45:43.12072
c783f4b6-9312-4f34-8abf-58e29ab13bcd	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 07:14:53.258052	2026-04-07 07:45:43.232464
f383531b-334c-44e2-8e16-beee939dc54f	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 07:07:58.002721	2026-04-07 07:45:43.46533
36c44037-22f7-43a7-859c-9950813624c6	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 07:07:50.711777	2026-04-07 07:45:43.577567
1113bde8-10af-4ded-8c7e-d5ef21a81547	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-06 13:38:06.280727	2026-04-07 07:45:43.94501
0a552ca0-2405-42ce-a342-33bd260b108f	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-07 08:06:54.258419	2026-04-07 08:06:54.258427
3694de59-e288-456b-a071-a8facc4770f8	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-07 08:06:54.258432	2026-04-07 08:06:54.258436
b5c0cc24-c85c-4a3c-a759-6f33dd82c7b2	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-07 08:43:58.248041	2026-04-07 08:43:58.248046
b59ae854-9a1e-4490-9500-6b92b20ebc90	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-2937753063248	2026-04-07 08:43:58.248049	2026-04-07 08:43:58.248051
a9cb80bd-8d3a-4967-b9dd-0b90565e6f41	alert	Detection Alert: Parking Lot Exit	vehicle detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-07 13:18:53.055604	2026-04-07 13:18:53.05561
480f2c5a-e386-452f-b338-cb3641f78528	alert	Detection Alert: Parking Lot Exit	vehicle detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-07 13:18:53.055614	2026-04-07 13:18:53.055615
cad10213-3cc3-4e2b-81fa-99bfde377764	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	t	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-07 14:12:36.510022	2026-04-09 06:47:47.861602
2f38e6ff-f95d-4b4d-a104-25a5c19edd29	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	2026-04-15 07:50:57.894079	2026-04-15 07:50:57.894082
dbfc3ed8-6f1a-4f4f-8cd7-7bfb9e4e6182	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-2937753063248	2026-04-15 07:50:57.894085	2026-04-15 07:50:57.894086
49d539d7-8601-48d7-b356-d919d093514e	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-15 08:37:16.919573	2026-04-15 08:37:16.919576
f7d01255-7df0-472f-b741-341530dc5047	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-15 10:40:27.652628	2026-04-15 10:40:27.652631
5c2841bb-fc5b-424d-b519-5c76b85d977d	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 10:49:44.126343	2026-04-15 11:46:58.69303
cc6c8248-9dfe-45ef-b15e-865efa17bf51	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 10:48:29.136711	2026-04-15 11:46:59.281424
fb133b4e-5fef-4f54-8901-b8c37ac1d1f1	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 10:37:44.509885	2026-04-15 11:46:59.414408
49b60504-0438-4f56-9db4-d99a08bc924f	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 11:34:27.995195	2026-04-15 11:46:59.899966
7c33aefb-b738-4765-a091-8ad9e84ec406	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	t	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 11:54:08.39997	2026-04-15 12:00:51.023346
bea1270f-44ec-4ac4-aa5c-0e34f5ae4616	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 12:01:07.559701	2026-04-15 12:01:07.559707
8c2e18ba-96ae-4328-9467-828df2b98f12	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 12:23:08.354122	2026-04-15 12:23:08.354131
8667798d-ffb0-48f8-abea-b3b2d5a7e9ec	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 12:29:14.657676	2026-04-15 12:29:14.657679
a7211696-a5b0-40fb-a8a4-3d7f90283758	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-15 12:40:51.063769	2026-04-15 12:40:51.063777
7817d72c-a1b0-45dd-8b6f-814e3e3a008c	alert	Detection Alert: Main Entrance Camera	criminal detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-15 12:51:17.741177	2026-04-15 12:51:17.74118
b70f869e-744c-4e08-87e5-9d03a9e38583	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 12:51:22.162165	2026-04-15 12:51:22.162168
23ea5e2b-6bd8-464b-9034-565b60608a8d	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 13:02:58.077922	2026-04-15 13:02:58.077924
7aed6f1d-78b1-4ab9-a71a-98b3aac49482	alert	Detection Alert: Main Entrance Camera	vehicle detected at Main Entrance Camera	f	/cameras?id=cam-4c261426	usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	2026-04-15 13:15:13.175675	2026-04-15 13:15:13.175682
e385789d-38bf-4f74-9c98-2f8000a093ea	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-15 13:53:42.784106	2026-04-15 13:53:42.784257
e684b027-4d1e-4b57-94de-58fbd5ac37f3	alert	Detection Alert: Parking Lot Exit	criminal detected at Parking Lot Exit	f	/cameras?id=cam-cb940588	usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	2026-04-15 14:02:23.850079	2026-04-15 14:02:23.850086
\.


--
-- Data for Name: officerlocation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.officerlocation (id, user_id, organization_id, lat, lng, heading, speed, is_online, last_seen, created_at, updated_at) FROM stdin;
loc-5f4a3254-0471-4808-8056-91d6124084c4	usr-2255431615264	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	8.988854761618102	38.77046152418257	-1	-1	t	2026-04-15 12:22:54.627768	2026-04-15 11:17:44.491856	2026-04-15 12:22:54.629165
loc-fb8d9b00-7786-4245-8332-0c48f5d201f6	usr-super-admin	org-admin-main	9	38	\N	\N	t	2026-04-15 11:26:41.140078	2026-04-15 11:26:41.235805	2026-04-15 11:26:41.235812
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization (id, name, admin_email, status, features, parent_id, lat, lng, created_at, updated_at, company_type) FROM stdin;
org-admin-main	Main Administration	admin@cims.com	active	{}	\N	\N	\N	2026-04-03 08:07:55.456053	2026-04-03 08:07:55.456055	\N
comp-f5686e69-8379-4037-9bce-aa658ab27539	INSA	admin@insa.com	active	{}	\N	9.040491502680464	38.75616073608399	2026-04-03 08:28:17.550818	2026-04-03 12:03:05.71362	\N
comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	EFP	admin@efp.com	active	{}	\N	9.04752264605715	38.739830027110955	2026-04-03 13:08:39.896286	2026-04-03 13:08:39.896289	\N
comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	Traffic 	admin@traffic.com	active	{}	\N	9.035501622743618	38.75371456146241	2026-04-15 10:17:46.314395	2026-04-15 10:17:46.314399	traffic_police
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (id, name, description, permissions, organization_id, users_count, is_system, created_at, updated_at) FROM stdin;
role-super-admin	Super Admin	Global system administrator	["*"]	\N	0	t	2026-04-03 08:07:55.452248	2026-04-03 08:07:55.452252
role-admin	Admin	Organization administrator	["users.manage", "cameras.manage", "reports.view"]	\N	0	t	2026-04-03 08:07:55.452253	2026-04-03 08:07:55.452254
role-operator	Operator	Surveillance operator	["cameras.view", "detections.view", "cases.view", "cases.manage"]	\N	0	t	2026-04-03 08:07:55.452255	2026-04-03 08:07:55.452255
role-8899fe4f-05d5-44e5-a627-cb7f9eaa7d53	Company Admin	Administrator for INSA	["*"]	comp-f5686e69-8379-4037-9bce-aa658ab27539	0	f	2026-04-03 08:28:17.552861	2026-04-03 08:28:17.552864
role-30e522e7-eaea-4d81-9862-fcea65ab6c29	User Role		["detections.view", "detections.manage"]	comp-f5686e69-8379-4037-9bce-aa658ab27539	0	f	2026-04-03 08:30:24.569649	2026-04-03 08:30:24.569653
role-312bc459-e6f4-44fa-a9e4-306e9ed2f676	Company Admin	Administrator for EFP	["*"]	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	0	f	2026-04-03 13:08:39.903544	2026-04-03 13:08:39.903547
role-7805676b-fbaa-4ecb-bc4e-4c3702d3375e	user role		["cameras.view", "detections.view", "detections.manage", "notifications.view", "notifications.manage"]	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	0	f	2026-04-03 13:10:01.571408	2026-04-03 13:10:09.880018
role-0e551d1c-25bb-42b8-9c34-086247e9435b	Company Admin	Administrator for Traffic 	["*"]	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	0	f	2026-04-15 10:17:46.326924	2026-04-15 10:17:46.326929
\.


--
-- Data for Name: trafficalert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trafficalert (id, detection_id, officer_id, camera_id, organization_id, status, distance_km, notes, proof_urls, accepted_at, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, email, hashed_password, full_name, organization_id, role_id, status, created_at, updated_at, expo_push_token) FROM stdin;
usr-super-admin	admin@cims.com	$pbkdf2-sha256$29000$0BpjDKH0/t.bszYmZGztXQ$FiPGPPH4E5YGiEoBcZ0lDhY/p47M8cmF.IoNlI/hBaA	Global Administrator	org-admin-main	role-super-admin	active	2026-04-03 08:07:55.47384	2026-04-03 08:07:55.473843	\N
usr-9c6f7acb-9b8c-4865-a4c5-fc4ab0d7d39e	admin@insa.com	$pbkdf2-sha256$29000$tnZO6Z3zPidk7L1XynmPMQ$7IIUp1lCSVXj5K2Npnjhg5ZoZAz/CRb9CHWnp9QcXis	INSA Admin	comp-f5686e69-8379-4037-9bce-aa658ab27539	role-8899fe4f-05d5-44e5-a627-cb7f9eaa7d53	active	2026-04-03 08:28:17.555053	2026-04-03 08:28:17.555056	\N
usr-1929273432320	user1@insa.com	$pbkdf2-sha256$29000$COEcIwSAUGotZcwZI.Q8Jw$6VhP6RPoIxsroY9hADT0ON9RXo8SnNmLUpDDMQ0SNtg	User1	comp-f5686e69-8379-4037-9bce-aa658ab27539	role-30e522e7-eaea-4d81-9862-fcea65ab6c29	active	2026-04-03 08:29:14.593126	2026-04-03 08:30:33.824337	\N
usr-1929978280480	user2@insa.com	$pbkdf2-sha256$29000$IeT8H0PoXevdWwth7N17Dw$k8oroP4zW5zun08OrGp7RQglfEwNHGB0L/xBAZG76K4	User2	comp-f5686e69-8379-4037-9bce-aa658ab27539	role-30e522e7-eaea-4d81-9862-fcea65ab6c29	active	2026-04-03 08:29:25.276279	2026-04-03 08:30:44.712744	\N
usr-ea54469c-ccb8-4352-a00e-d8f62631d50f	admin@efp.com	$pbkdf2-sha256$29000$B0DIeY.RUso5xzjHmNN6zw$91tTs010Rhm7.aODrtWnFufyS0J0tMxNTHIKnoiBKqY	EFP Admin	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	role-312bc459-e6f4-44fa-a9e4-306e9ed2f676	active	2026-04-03 13:08:39.905077	2026-04-03 13:08:39.90508	\N
usr-2937753063248	user1@efp.com	$pbkdf2-sha256$29000$ei/lnDOG8F7rvdf6HwOA0A$TPd1C3mhzKY2TGE/h3VtbXRjZLmO9pJIgoX9yJGOhlc	user1	comp-9851e3c0-bd84-4c23-81bc-04282552bbeb	role-7805676b-fbaa-4ecb-bc4e-4c3702d3375e	active	2026-04-03 13:09:40.61208	2026-04-03 13:10:19.398719	\N
usr-13f13acd-662c-4cfd-a78e-b72a1b3aad29	admin@traffic.com	$pbkdf2-sha256$29000$Ogfg3FvL.Z/Tutc6pzSGcA$9wI4hsgLGK6zh2zAs2BltRA3mFYwW1WNQw5pMcJRUxg	Traffic  Admin	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	role-0e551d1c-25bb-42b8-9c34-086247e9435b	active	2026-04-15 10:17:46.331792	2026-04-15 10:17:46.331796	\N
usr-2255431615264	user@traffic.com	$pbkdf2-sha256$29000$J.R8D4EQYkxp7b33/v9fiw$9ltK8YKCdoREvMld3sdqRRkMfreIAow4mx0tZWAIO5M	User	comp-66f1a93e-d62a-4817-a173-bb2e4d610ca9	role-operator	active	2026-04-15 10:28:29.591401	2026-04-15 10:28:29.591408	\N
\.


--
-- Data for Name: weapondetection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weapondetection (id, weapon_type, description, confidence, image_url, camera_id, camera_name, organization_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: camera camera_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_pkey PRIMARY KEY (id);


--
-- Name: cameraaccess cameraaccess_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cameraaccess
    ADD CONSTRAINT cameraaccess_pkey PRIMARY KEY (id);


--
-- Name: detection detection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection
    ADD CONSTRAINT detection_pkey PRIMARY KEY (id);


--
-- Name: formtemplate formtemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formtemplate
    ADD CONSTRAINT formtemplate_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: officerlocation officerlocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.officerlocation
    ADD CONSTRAINT officerlocation_pkey PRIMARY KEY (id);


--
-- Name: officerlocation officerlocation_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.officerlocation
    ADD CONSTRAINT officerlocation_user_id_key UNIQUE (user_id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: trafficalert trafficalert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafficalert
    ADD CONSTRAINT trafficalert_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: weapondetection weapondetection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weapondetection
    ADD CONSTRAINT weapondetection_pkey PRIMARY KEY (id);


--
-- Name: ix_camera_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_camera_id ON public.camera USING btree (id);


--
-- Name: ix_camera_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_camera_name ON public.camera USING btree (name);


--
-- Name: ix_cameraaccess_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cameraaccess_id ON public.cameraaccess USING btree (id);


--
-- Name: ix_detection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_detection_id ON public.detection USING btree (id);


--
-- Name: ix_detection_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_detection_name ON public.detection USING btree (name);


--
-- Name: ix_formtemplate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_formtemplate_id ON public.formtemplate USING btree (id);


--
-- Name: ix_notification_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notification_id ON public.notification USING btree (id);


--
-- Name: ix_officerlocation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_officerlocation_id ON public.officerlocation USING btree (id);


--
-- Name: ix_organization_admin_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_organization_admin_email ON public.organization USING btree (admin_email);


--
-- Name: ix_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_organization_id ON public.organization USING btree (id);


--
-- Name: ix_organization_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_organization_name ON public.organization USING btree (name);


--
-- Name: ix_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_role_id ON public.role USING btree (id);


--
-- Name: ix_role_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_role_name ON public.role USING btree (name);


--
-- Name: ix_trafficalert_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_trafficalert_id ON public.trafficalert USING btree (id);


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: ix_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_id ON public."user" USING btree (id);


--
-- Name: ix_weapondetection_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_weapondetection_id ON public.weapondetection USING btree (id);


--
-- Name: camera camera_linked_traffic_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_linked_traffic_company_id_fkey FOREIGN KEY (linked_traffic_company_id) REFERENCES public.organization(id);


--
-- Name: camera camera_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camera
    ADD CONSTRAINT camera_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: cameraaccess cameraaccess_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cameraaccess
    ADD CONSTRAINT cameraaccess_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(id);


--
-- Name: cameraaccess cameraaccess_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cameraaccess
    ADD CONSTRAINT cameraaccess_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: detection detection_assigned_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection
    ADD CONSTRAINT detection_assigned_company_id_fkey FOREIGN KEY (assigned_company_id) REFERENCES public.organization(id);


--
-- Name: detection detection_form_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection
    ADD CONSTRAINT detection_form_template_id_fkey FOREIGN KEY (form_template_id) REFERENCES public.formtemplate(id);


--
-- Name: detection detection_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection
    ADD CONSTRAINT detection_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: detection detection_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection
    ADD CONSTRAINT detection_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: formtemplate formtemplate_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formtemplate
    ADD CONSTRAINT formtemplate_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: notification notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: officerlocation officerlocation_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.officerlocation
    ADD CONSTRAINT officerlocation_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: officerlocation officerlocation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.officerlocation
    ADD CONSTRAINT officerlocation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: organization organization_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.organization(id);


--
-- Name: role role_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: trafficalert trafficalert_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafficalert
    ADD CONSTRAINT trafficalert_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(id);


--
-- Name: trafficalert trafficalert_detection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafficalert
    ADD CONSTRAINT trafficalert_detection_id_fkey FOREIGN KEY (detection_id) REFERENCES public.detection(id);


--
-- Name: trafficalert trafficalert_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafficalert
    ADD CONSTRAINT trafficalert_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES public."user"(id);


--
-- Name: trafficalert trafficalert_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafficalert
    ADD CONSTRAINT trafficalert_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: user user_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- Name: user user_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- Name: weapondetection weapondetection_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weapondetection
    ADD CONSTRAINT weapondetection_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.camera(id);


--
-- Name: weapondetection weapondetection_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weapondetection
    ADD CONSTRAINT weapondetection_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organization(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FsjGoWPX1lieUjgzlQcS4VnSJJPNj4xH7kltQiR9CgyRZU3g65JYVEHa460LQqO


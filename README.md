# StylesSync - AI-Powered Fashion Platform 

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-orange.svg)](https://clerk.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple.svg)](https://stripe.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-brightgreen.svg)](https://fastapi.tiangolo.com/)

StylesSync is a comprehensive fashion platform that revolutionizes how people discover, buy, sell, and rent fashion items. Our AI-powered system provides personalized recommendations based on your style preferences and skin tone, while our integrated marketplace enables seamless peer-to-peer transactions.


## 📑 Table of Contents
- [Demo](#demo)
- [Features](#features)
  - [AI-Powered Intelligence](#ai-powered-intelligence)
  - [Multi-Modal Shopping](#multi-modal-shopping)
  - [User Experience](#user-experience)
  - [Secure Payments](#secure-payments)
- [System Architecture Diagram](#system-architecture-diagram)
- [Sequence Diagram](#sequence-diagram)
- [AI-Architecture Diagram (Conceptual)](#ai-architecture-diagram-conceptual)
- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend & Services](#backend--services)
  - [AI & Machine Learning](#ai--machine-learning)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Database Setup](#database-setup)
    - [Stripe Setup](#stripe-setup)
    - [Clerk Setup](#clerk-setup)
- [Key Screens](#key-screens)
- [AI Features Deep Dive](#ai-features-deep-dive)
  - [Skin Tone Matching](#skin-tone-matching)
  - [Size Prediction](#size-prediction)
  - [Recommendation Engine](#recommendation-engine)
- [Contributing](#contributing)

                                                                                   
## Demo

[▶️ Watch Demo on YouTube](https://youtu.be/KfduQByZijQ)

## Features

### AI-Powered Intelligence
- **Smart Recommendations**: AI analyzes your preferences to suggest perfect fashion matches
- **Skin Tone Matching**: Advanced computer vision to match clothing colors with your skin tone
- **Size Prediction**: AI-driven size recommendations based on body measurements and fit data
- **Style Learning**: Algorithm continuously learns from your interactions and preferences

### Multi-Modal Shopping
- **Traditional Shopping**: Browse curated fashion collections
- **P2P Marketplace**: Buy and sell pre-owned fashion items
- **Rental Service**: Rent designer pieces for special occasions
- **Wishlist & Cart**: Save favorites and manage purchases seamlessly

### User Experience
- **Dual Mode Interface**: Switch between Buyer and Seller modes
- **Real-time Notifications**: Stay updated on orders, offers, and recommendations
- **Advanced Search**: Find exactly what you're looking for with smart filters
- **Order Management**: Track purchases, sales, and rental history

### Secure Payments
- **Stripe Integration**: Secure payment processing
- **Multiple Payment Methods**: Cards, digital wallets, and more
- **Seller Earnings**: Transparent earnings tracking and payouts
- **Voucher System**: Discount codes and promotional offers

## System Architecture Diagram 

<img width="744" height="627" alt="Screenshot 2025-08-11 at 10 29 45 AM" src="https://github.com/user-attachments/assets/b467de45-8fe7-44e2-a6c7-ea998201f8c8" />

## Sequence Diagram 

[Sequence Diagram on eraser.io](https://app.eraser.io/workspace/0h4mx0Uuc9nXbhlouwQW)

## AI-Architecture Diagram (Conceptual)

[AI-Architecture Diagram (Conceptual) on eraser.io](https://app.eraser.io/workspace/QwHcJwWs7cWxnZPShuDW)

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation** - Navigation management
- **Expo** - Development and build tooling

### Backend & Services
- **Supabase** - Database, authentication, and storage
- **Clerk** - Advanced authentication and user management
- **Stripe** - Payment processing
- **Python FastAPI** - AI services and machine learning

### AI & Machine Learning
- **Computer Vision** - Skin tone analysis and matching
- **Recommendation Engine** - Personalized fashion suggestions
- **Size Prediction** - Body measurement analysis
- **Image Processing** - Product image optimization

## Getting Started

### Prerequisites
- Node.js 18+ 
- React Native development environment
- iOS Simulator or Android Emulator
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stylesync.git
   cd stylesync
   ```

2. **Install dependencies**
   ```bash
   # Main app dependencies
   npm install
   
   # AI API dependencies
   cd stylesync/ai_api
   pip install -r requirements.txt
   cd ../..
   ```

3. **Environment Setup**
   
   Create `.env` file in the root directory:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Clerk Authentication
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   
   # Stripe Payments
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Database Setup**

| table_name             |
| ---------------------- |
| cart_items             |
| carts                  |
| deliveries             |
| detailed_fashion_items |
| fashion_items          |
| order_items            |
| orders                 |
| payments               |
| product_likes          |
| products               |
| roles                  |
| seller_earnings        |
| seller_profiles        |
| user_addresses         |
| user_interactions      |
| users                  |

| table\_name                  | create\_statement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **cart\_items**              | `sql CREATE TABLE cart_items ( cart_id bigint, source_screen text, added_at timestamp with time zone DEFAULT now(), color character varying(50), size character varying(10), quantity integer DEFAULT 1, product_id bigint, cart_item_id bigint NOT NULL DEFAULT nextval('cart_items_cart_item_id_seq'::regclass) ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **carts**                    | `sql CREATE TABLE carts ( user_id character varying(255), created_at timestamp with time zone DEFAULT now(), cart_id bigint NOT NULL DEFAULT nextval('carts_cart_id_seq'::regclass) ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **deliveries**               | `sql CREATE TABLE deliveries ( carrier_name character varying(100), tracking_number character varying(100), order_id bigint, delivery_id bigint NOT NULL DEFAULT nextval('deliveries_delivery_id_seq'::regclass), updated_at timestamp with time zone DEFAULT now(), delivery_status character varying(50) DEFAULT 'preparing'::character varying, estimated_delivery_date date ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **detailed\_fashion\_items** | `sql CREATE TABLE detailed_fashion_items ( article_attributes jsonb, cod_enabled boolean, style_images jsonb, master_category jsonb, sub_category jsonb, article_type jsonb, is_emi_enabled boolean, other_flags jsonb, article_display_attr jsonb, created_at timestamp with time zone DEFAULT now(), image_filename text, product_descriptors jsonb, image_url text, discount_data jsonb, style_options jsonb, catalog_add_date bigint, brand_name text, age_group text, gender text, base_colour text, colour1 text, colour2 text, fashion_type text, season text, year text, usage text, vat numeric, display_categories text, weight text, navigation_id integer, landing_page_url text, cross_links jsonb, id bigint NOT NULL, price numeric, discounted_price numeric, style_type text, product_type_id integer, article_number text, visual_tag text, product_display_name text, variant_name text, myntra_rating numeric ); ` |
| **fashion\_items**           | `sql CREATE TABLE fashion_items ( id bigint NOT NULL DEFAULT nextval('fashion_items_id_seq'::regclass), user_id text NOT NULL, name text NOT NULL, description text, price numeric NOT NULL, sizes ARRAY NOT NULL, category character varying(50) NOT NULL, condition character varying(50) NOT NULL, brand character varying(100), colors ARRAY NOT NULL, source_screen character varying(10) NOT NULL, status character varying(20) NOT NULL DEFAULT 'active'::character varying, quantity_sold integer NOT NULL DEFAULT 0, image_urls ARRAY NOT NULL, created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, deleted_status character varying(20) DEFAULT NULL::character varying ); `                                                                                                                                                                       |
| **order\_items**             | `sql CREATE TABLE order_items ( color character varying(50), order_item_id bigint NOT NULL DEFAULT nextval('order_items_order_item_id_seq'::regclass), order_id bigint, product_id bigint, quantity integer, size character varying(10), price numeric, image_url text, source_screen character varying(20) DEFAULT 'home'::character varying ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **orders**                   | `sql CREATE TABLE orders ( payment_status character varying(50) DEFAULT 'unpaid'::character varying, order_status character varying(50) DEFAULT 'pending'::character varying, total_amount numeric, shipping_address character varying, user_id character varying(255), order_id bigint NOT NULL DEFAULT nextval('orders_order_id_seq'::regclass), payment_id bigint, placed_at timestamp with time zone DEFAULT now(), payment_method character varying(50) ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **payments**                 | `sql CREATE TABLE payments ( transaction_id character varying(100), payment_id bigint NOT NULL DEFAULT nextval('payments_payment_id_seq'::regclass), order_id bigint, user_id character varying(255), payment_method character varying(50), amount numeric, payment_status character varying(50) DEFAULT 'pending'::character varying, paid_at timestamp with time zone ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **product\_likes**           | `sql CREATE TABLE product_likes ( source_screen character varying(20) DEFAULT 'home'::character varying, like_id bigint NOT NULL DEFAULT nextval('product_likes_like_id_seq'::regclass), user_id character varying(255), product_id bigint, liked_at timestamp with time zone DEFAULT now() ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **products**                 | `sql CREATE TABLE products ( description text, price numeric, stock_quantity integer, image_url text, created_at timestamp with time zone DEFAULT now(), product_name character varying(100), product_id bigint NOT NULL DEFAULT nextval('products_product_id_seq'::regclass) ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **roles**                    | `sql CREATE TABLE roles ( role_id integer NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass), role_name character varying(50) NOT NULL ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **seller\_earnings**         | `sql CREATE TABLE seller_earnings ( sale_amount numeric NOT NULL, id bigint NOT NULL DEFAULT nextval('seller_earnings_id_seq'::regclass), user_id text NOT NULL, item_id integer NOT NULL, item_name text NOT NULL, commission_rate numeric NOT NULL DEFAULT 5.00, net_amount numeric NOT NULL, sale_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP, payment_status character varying(50) NOT NULL DEFAULT 'pending'::character varying, created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, image_url text ); `                                                                                                                                                                                                                                                                                                                                    |
| **seller\_profiles**         | `sql CREATE TABLE seller_profiles ( city character varying(255) NOT NULL, post_code character varying(20) NOT NULL, full_address text NOT NULL, verification_status character varying(50) NOT NULL DEFAULT 'pending'::character varying, verification_notes text, created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, id_type character varying(50) NOT NULL, account_holder_name character varying(255) NOT NULL, account_number character varying(255) NOT NULL, bank_name character varying(255) NOT NULL, user_id text NOT NULL, id_number character varying(255) NOT NULL, id bigint NOT NULL DEFAULT nextval('seller_profiles_id_seq'::regclass), state character varying(255) NOT NULL ); `                                                                                                                                                           |
| **user\_addresses**          | `sql CREATE TABLE user_addresses ( postal_code character varying(20), address_line1 character varying(255), address_line2 character varying(255), city character varying(100), state character varying(100), phone_number character varying(20), country character varying(100), is_default boolean DEFAULT false, address_id bigint NOT NULL DEFAULT nextval('user_addresses_address_id_seq'::regclass), user_id character varying(255), full_name character varying(100) ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **user\_interactions**       | `sql CREATE TABLE user_interactions ( interaction_type text NOT NULL, interaction_weight integer NOT NULL DEFAULT 1, created_at timestamp with time zone DEFAULT now(), interaction_id integer NOT NULL DEFAULT nextval('user_interactions_interaction_id_seq'::regclass), user_id text NOT NULL, product_id integer NOT NULL ); `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **users**                    | `sql CREATE TABLE users ( address jsonb, payment_method jsonb, email character varying(100) NOT NULL, username character varying(50) NOT NULL, user_id character varying(255) NOT NULL, password_hash character varying(255) NOT NULL, phone character varying(20), created_at timestamp with time zone DEFAULT now(), is_social_login boolean DEFAULT false, updated_at timestamp with time zone DEFAULT now(), first_name character varying(100), last_name character varying(100), clerk_user_id character varying(255), profile_image_url text ); `                                                                                                                                                                                                                                                                                                                                                                                |



                                                       |
| schema_name | table_name      | enable_rls_statement                                          |
| ----------- | --------------- | ------------------------------------------------------------- |
| public      | carts           | ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;           |
| public      | fashion_items   | ALTER TABLE public.fashion_items ENABLE ROW LEVEL SECURITY;   |
| public      | order_items     | ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;     |
| public      | orders          | ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;          |
| public      | payments        | ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;        |
| public      | product_likes   | ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;   |
| public      | products        | ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;        |
| public      | seller_earnings | ALTER TABLE public.seller_earnings ENABLE ROW LEVEL SECURITY; |
| public      | seller_profiles | ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY; |
| public      | user_addresses  | ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;  |
| public      | users           | ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;           |

| schema\_name | table\_name      | policy\_name                                       | permissive | command | expression                                                                                                                                  | with\_check                              | polroles                       | roles\_names  | create\_policy\_statement                                                                                                                                                                                                                    |          |                                                                                                                                                                                                               |   |                                 |
| ------------ | ---------------- | -------------------------------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | - | ------------------------------- |
| public       | carts            | Enable all access for authenticated users on carts | PERMISSIVE | ALL     | `true`                                                                                                                                      | `true`                                   | \[16479]                       | authenticated | `sql CREATE POLICY Enable all access for authenticated users on carts ON public.carts FOR ALL TO authenticated USING (true) WITH CHECK (true); `                                                                                             |          |                                                                                                                                                                                                               |   |                                 |
| public       | carts            | Users can create their own cart                    | PERMISSIVE | INSERT  | `null`                                                                                                                                      | `((user_id)::text = (auth.uid())::text)` | \[16479]                       | authenticated | `sql CREATE POLICY Users can create their own cart ON public.carts FOR INSERT TO authenticated WITH CHECK (((user_id)::text = (auth.uid())::text)); `                                                                                        |          |                                                                                                                                                                                                               |   |                                 |
| public       | carts            | Users can delete their own cart                    | PERMISSIVE | DELETE  | `((user_id)::text = (auth.uid())::text)`                                                                                                    | `null`                                   | \[16479]                       | authenticated | `sql CREATE POLICY Users can delete their own cart ON public.carts FOR DELETE TO authenticated USING (((user_id)::text = (auth.uid())::text)); `                                                                                             |          |                                                                                                                                                                                                               |   |                                 |
| public       | carts            | Users can manage own cart                          | PERMISSIVE | ALL     | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can manage own cart ON public.carts FOR ALL TO USING (true); `                                                                                                                                                      |          |                                                                                                                                                                                                               |   |                                 |
| public       | carts            | Users can update their own cart                    | PERMISSIVE | UPDATE  | `((user_id)::text = (auth.uid())::text)`                                                                                                    | `null`                                   | \[16479]                       | authenticated | `sql CREATE POLICY Users can update their own cart ON public.carts FOR UPDATE TO authenticated USING (((user_id)::text = (auth.uid())::text)); `                                                                                             |          |                                                                                                                                                                                                               |   |                                 |
| public       | carts            | Users can view their own cart                      | PERMISSIVE | SELECT  | `((user_id)::text = (auth.uid())::text)`                                                                                                    | `null`                                   | \[16479]                       | authenticated | `sql CREATE POLICY Users can view their own cart ON public.carts FOR SELECT TO authenticated USING (((user_id)::text = (auth.uid())::text)); `                                                                                               |          |                                                                                                                                                                                                               |   |                                 |
| public       | fashion\_items   | Allow all operations for fashion\_items            | PERMISSIVE | ALL     | `true`                                                                                                                                      | `true`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Allow all operations for fashion_items ON public.fashion_items FOR ALL TO USING (true) WITH CHECK (true); `                                                                                                               |          |                                                                                                                                                                                                               |   |                                 |
| public       | order\_items     | Enable insert for authenticated users only         | PERMISSIVE | INSERT  | `null`                                                                                                                                      | `true`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Enable insert for authenticated users only ON public.order_items FOR INSERT TO WITH CHECK (true); `                                                                                                                       |          |                                                                                                                                                                                                               |   |                                 |
| public       | order\_items     | Temp allow all select                              | PERMISSIVE | SELECT  | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Temp allow all select ON public.order_items FOR SELECT TO USING (true); `                                                                                                                                                 |          |                                                                                                                                                                                                               |   |                                 |
| public       | order\_items     | Users can delete their own order items             | PERMISSIVE | DELETE  | `sql (EXISTS ( SELECT 1 FROM orders WHERE ((orders.order_id = order_items.order_id) AND ((orders.user_id)::text = (auth.uid())::text)) )) ` | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can delete their own order items ON public.order_items FOR DELETE TO USING ((EXISTS ( SELECT 1 FROM orders WHERE ((orders.order_id = order_items.order_id) AND ((orders.user_id)::text = (auth.uid())::text))))); ` |          |                                                                                                                                                                                                               |   |                                 |
| public       | order\_items     | Users can update their own order items             | PERMISSIVE | UPDATE  | `sql (EXISTS ( SELECT 1 FROM orders WHERE ((orders.order_id = order_items.order_id) AND ((orders.user_id)::text = (auth.uid())::text)) )) ` | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can update their own order items ON public.order_items FOR UPDATE TO USING ((EXISTS ( SELECT 1 FROM orders WHERE ((orders.order_id = order_items.order_id) AND ((orders.user_id)::text = (auth.uid())::text))))); ` |          |                                                                                                                                                                                                               |   |                                 |
| public       | order\_items     | Users can view their own order items               | PERMISSIVE | SELECT  | \`\`\`sql (order\_id IN ( SELECT orders.order\_id FROM orders WHERE ((orders.user\_id)::text = ('user\_'::text                              |                                          | (auth.uid())::text)) )) \`\`\` | `null`        | \[0]                                                                                                                                                                                                                                         | *(none)* | \`\`\`sql CREATE POLICY Users can view their own order items ON public.order\_items FOR SELECT TO USING ((order\_id IN ( SELECT orders.order\_id FROM orders WHERE ((orders.user\_id)::text = ('user\_'::text |   | (auth.uid())::text))))); \`\`\` |
| public       | orders           | Enable insert access for authenticated users       | PERMISSIVE | INSERT  | `null`                                                                                                                                      | `((auth.uid())::text = (user_id)::text)` | \[16479]                       | authenticated | `sql CREATE POLICY Enable insert access for authenticated users ON public.orders FOR INSERT TO authenticated WITH CHECK (((auth.uid())::text = (user_id)::text)); `                                                                          |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Enable read access for authenticated users         | PERMISSIVE | SELECT  | `((auth.uid())::text = (user_id)::text)`                                                                                                    | `null`                                   | \[16479]                       | authenticated | `sql CREATE POLICY Enable read access for authenticated users ON public.orders FOR SELECT TO authenticated USING (((auth.uid())::text = (user_id)::text)); `                                                                                 |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Enable update access for authenticated users       | PERMISSIVE | UPDATE  | `((auth.uid())::text = (user_id)::text)`                                                                                                    | `((auth.uid())::text = (user_id)::text)` | \[16479]                       | authenticated | `sql CREATE POLICY Enable update access for authenticated users ON public.orders FOR UPDATE TO authenticated USING (((auth.uid())::text = (user_id)::text)) WITH CHECK (((auth.uid())::text = (user_id)::text)); `                           |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Users can delete their own orders                  | PERMISSIVE | DELETE  | `((auth.uid())::text = (user_id)::text)`                                                                                                    | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can delete their own orders ON public.orders FOR DELETE TO USING (((auth.uid())::text = (user_id)::text)); `                                                                                                        |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Users can insert their own orders                  | PERMISSIVE | INSERT  | `null`                                                                                                                                      | `((auth.uid())::text = (user_id)::text)` | \[0]                           | *(none)*      | `sql CREATE POLICY Users can insert their own orders ON public.orders FOR INSERT TO WITH CHECK (((auth.uid())::text = (user_id)::text)); `                                                                                                   |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Users can manage own orders                        | PERMISSIVE | ALL     | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can manage own orders ON public.orders FOR ALL TO USING (true); `                                                                                                                                                   |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Users can update their own orders                  | PERMISSIVE | UPDATE  | `((auth.uid())::text = (user_id)::text)`                                                                                                    | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can update their own orders ON public.orders FOR UPDATE TO USING (((auth.uid())::text = (user_id)::text)); `                                                                                                        |          |                                                                                                                                                                                                               |   |                                 |
| public       | orders           | Users can view their own orders                    | PERMISSIVE | SELECT  | `((auth.uid())::text = (user_id)::text)`                                                                                                    | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can view their own orders ON public.orders FOR SELECT TO USING (((auth.uid())::text = (user_id)::text)); `                                                                                                          |          |                                                                                                                                                                                                               |   |                                 |
| public       | payments         | Users can manage own payments                      | PERMISSIVE | ALL     | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can manage own payments ON public.payments FOR ALL TO USING (true); `                                                                                                                                               |          |                                                                                                                                                                                                               |   |                                 |
| public       | product\_likes   | Users can manage own likes                         | PERMISSIVE | ALL     | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can manage own likes ON public.product_likes FOR ALL TO USING (true); `                                                                                                                                             |          |                                                                                                                                                                                                               |   |                                 |
| public       | products         | Allow all operations on products                   | PERMISSIVE | ALL     | `true`                                                                                                                                      | `true`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Allow all operations on products ON public.products FOR ALL TO USING (true) WITH CHECK (true); `                                                                                                                          |          |                                                                                                                                                                                                               |   |                                 |
| public       | products         | Products are publicly readable                     | PERMISSIVE | SELECT  | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Products are publicly readable ON public.products FOR SELECT TO USING (true); `                                                                                                                                           |          |                                                                                                                                                                                                               |   |                                 |
| public       | seller\_earnings | Allow all operations for seller\_earnings          | PERMISSIVE | ALL     | `true`                                                                                                                                      | `true`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Allow all operations for seller_earnings ON public.seller_earnings FOR ALL TO USING (true) WITH CHECK (true); `                                                                                                           |          |                                                                                                                                                                                                               |   |                                 |
| public       | seller\_profiles | Allow all operations for seller\_profiles          | PERMISSIVE | ALL     | `true`                                                                                                                                      | `true`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Allow all operations for seller_profiles ON public.seller_profiles FOR ALL TO USING (true) WITH CHECK (true); `                                                                                                           |          |                                                                                                                                                                                                               |   |                                 |
| public       | user\_addresses  | Users can manage own addresses                     | PERMISSIVE | ALL     | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Users can manage own addresses ON public.user_addresses FOR ALL TO USING (true); `                                                                                                                                        |          |                                                                                                                                                                                                               |   |                                 |
| public       | users            | Allow all operations for users                     | PERMISSIVE | ALL     | `true`                                                                                                                                      | `null`                                   | \[0]                           | *(none)*      | `sql CREATE POLICY Allow all operations for users ON public.users FOR ALL TO USING (true); `                                                                                                                                                 |          |                                                                                                                                                                                                               |   |                                 |
                                                                                                                                                                                               
| schema\_name | function\_name              | function\_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | - | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public       | create\_order\_with\_items  | `sql CREATE OR REPLACE FUNCTION public.create_order_with_items( p_user_id text, p_shipping_address text, p_total_amount numeric, p_product_id bigint, p_quantity integer, p_size text, p_color text, p_price numeric ) RETURNS TABLE(order_id bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_order_id bigint; BEGIN INSERT INTO orders ( user_id, shipping_address, total_amount, order_status ) VALUES ( cast_to_uuid(p_user_id), p_shipping_address, p_total_amount, 'pending' ) RETURNING order_id INTO v_order_id; INSERT INTO order_items ( order_id, product_id, quantity, size, color, price ) VALUES ( v_order_id, p_product_id, p_quantity, p_size, p_color, p_price ); RETURN QUERY SELECT v_order_id; END; $function$ `                                                                                                                                                                                                                                                                            |   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public       | create\_order\_with\_items  | `sql CREATE OR REPLACE FUNCTION public.create_order_with_items( p_user_id text, p_shipping_address text, p_total_amount numeric, p_product_id bigint, p_quantity integer, p_size text, p_color text, p_price numeric, p_payment_id bigint ) RETURNS TABLE(order_id bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_order_id bigint; BEGIN INSERT INTO orders ( user_id, shipping_address, total_amount, order_status, payment_id ) VALUES ( cast_to_uuid(p_user_id), p_shipping_address, p_total_amount, 'completed', p_payment_id ) RETURNING order_id INTO v_order_id; INSERT INTO order_items ( order_id, product_id, quantity, size, color, price ) VALUES ( v_order_id, p_product_id, p_quantity, p_size, p_color, p_price ); IF p_payment_id IS NOT NULL THEN UPDATE payments SET order_id = v_order_id WHERE payment_id = p_payment_id; END IF; RETURN QUERY SELECT v_order_id; END; $function$ `                                                                                                       |   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public       | create\_order\_with\_items  | `sql CREATE OR REPLACE FUNCTION public.create_order_with_items( p_user_id character varying, p_shipping_address character varying, p_total_amount numeric, p_payment_method character varying, p_product_id integer, p_quantity integer, p_size character varying, p_color character varying, p_price numeric ) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $function$ DECLARE v_order_id INTEGER; BEGIN INSERT INTO orders ( user_id, shipping_address, total_amount, order_status, payment_status, payment_method, placed_at ) VALUES ( p_user_id, p_shipping_address, p_total_amount, 'successful', 'completed', p_payment_method, NOW() ) RETURNING order_id INTO v_order_id; INSERT INTO order_items ( order_id, product_id, quantity, size, color, price ) VALUES ( v_order_id, p_product_id, p_quantity, p_size, p_color, p_price ); RETURN v_order_id; END; $function$ `                                                                                                                                                                    |   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public       | create\_order\_with\_items  | `sql CREATE OR REPLACE FUNCTION public.create_order_with_items( p_user_id text, p_shipping_address text, p_total_amount numeric, p_product_id bigint, p_quantity integer, p_size text, p_color text, p_price numeric, p_payment_id bigint, p_payment_status text ) RETURNS TABLE(order_id bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_order_id bigint; BEGIN INSERT INTO orders ( user_id, shipping_address, total_amount, order_status, payment_status, payment_id ) VALUES ( p_user_id, p_shipping_address, p_total_amount, 'completed', p_payment_status, p_payment_id ) RETURNING orders.order_id INTO v_order_id; INSERT INTO order_items ( order_id, product_id, quantity, size, color, price ) VALUES ( v_order_id, p_product_id, p_quantity, p_size, p_color, p_price ); IF p_payment_id IS NOT NULL THEN UPDATE payments SET order_id = v_order_id WHERE payment_id = p_payment_id; END IF; RETURN QUERY SELECT orders.order_id FROM orders WHERE orders.order_id = v_order_id; END; $function$ ` |   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public       | sync\_clerk\_user\_custom   | \`\`\`sql CREATE OR REPLACE FUNCTION public.sync\_clerk\_user\_custom( p\_clerk\_user\_id text, p\_email text, p\_password text DEFAULT 'clerk\_managed'::text, p\_phone text DEFAULT NULL::text, p\_first\_name text DEFAULT NULL::text, p\_last\_name text DEFAULT NULL::text, p\_profile\_image\_url text DEFAULT NULL::text, p\_is\_social\_login boolean DEFAULT false ) RETURNS void LANGUAGE plpgsql AS \$function\$ DECLARE v\_username TEXT; v\_cart\_id INTEGER; v\_username\_counter INTEGER := 0; v\_final\_username TEXT; BEGIN v\_username := split\_part(p\_email, '@', 1); v\_final\_username := v\_username; WHILE EXISTS (SELECT 1 FROM users WHERE username = v\_final\_username) LOOP v\_username\_counter := v\_username\_counter + 1; v\_final\_username := v\_username                                                                                                                                                                                                                                                                |   | v\_username\_counter::TEXT; END LOOP; INSERT INTO users ( user\_id, clerk\_user\_id, username, email, password\_hash, phone, first\_name, last\_name, profile\_image\_url, is\_social\_login, updated\_at ) VALUES ( p\_clerk\_user\_id, p\_clerk\_user\_id, v\_final\_username, p\_email, p\_password, p\_phone, p\_first\_name, p\_last\_name, p\_profile\_image\_url, p\_is\_social\_login, CURRENT\_TIMESTAMP ) ON CONFLICT (user\_id) DO UPDATE SET email = EXCLUDED.email, phone = COALESCE(EXCLUDED.phone, users.phone), first\_name = EXCLUDED.first\_name, last\_name = EXCLUDED.last\_name, profile\_image\_url = EXCLUDED.profile\_image\_url, is\_social\_login = EXCLUDED.is\_social\_login, updated\_at = CURRENT\_TIMESTAMP; SELECT cart\_id INTO v\_cart\_id FROM carts WHERE user\_id = p\_clerk\_user\_id LIMIT 1; IF v\_cart\_id IS NULL THEN INSERT INTO carts (user\_id, created\_at) VALUES (p\_clerk\_user\_id, CURRENT\_TIMESTAMP); END IF; EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Error in sync\_clerk\_user\_custom: %', SQLERRM; END; \$function\$ \`\`\` |
| public       | update\_updated\_at\_column | `sql CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $function$ `                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### 4. **Stripe Setup**
   
To enable secure payment processing with Stripe in your Supabase Edge Functions:

### 4.1 Configure Stripe Secrets in Supabase
In your **Supabase Project Settings → Secrets**, add:
```
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4.2 Create Shared Utility Files for Edge Functions

Inside your Edge Functions folder (e.g., `supabase/functions/_shared/`), create:

**`stripe.ts`**
```
// @deno-types="npm:@types/stripe"
import Stripe from 'https://esm.sh/stripe@12.18.0';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});
```
**`cors.ts`**
```
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
```
### 4.3 Create the Payment Intent Edge Function

```
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency, productId, userId } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        productId: productId.toString(),
        userId
      },
      automatic_payment_methods: { enabled: true }
    });

    return new Response(JSON.stringify({
      publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      clientSecret: paymentIntent.client_secret
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```
### 4.4 Create the Web Hook Edge Function
```

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) throw new Error('No signature found in request');

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new Error('Webhook secret not configured');

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase credentials not configured');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { metadata } = paymentIntent;

        await supabase.from('payments').update({
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
          stripe_payment_id: paymentIntent.id
        }).eq('user_id', metadata.userId).eq('payment_status', 'pending');

        await supabase.from('orders').update({
          order_status: 'processing',
          payment_status: 'paid'
        }).eq('user_id', metadata.userId).eq('payment_status', 'pending');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const { metadata } = paymentIntent;

        await supabase.from('payments').update({
          payment_status: 'failed',
          stripe_payment_id: paymentIntent.id
        }).eq('user_id', metadata.userId).eq('payment_status', 'pending');

        await supabase.from('orders').update({
          order_status: 'cancelled',
          payment_status: 'failed'
        }).eq('user_id', metadata.userId).eq('payment_status', 'pending');
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const { metadata } = paymentIntent;

        await supabase.from('payments').update({
          payment_status: 'refunded',
          refunded_at: new Date().toISOString()
        }).eq('stripe_payment_id', paymentIntentId);

        await supabase.from('orders').update({
          order_status: 'refunded',
          payment_status: 'refunded'
        }).eq('user_id', metadata.userId).eq('payment_status', 'paid');
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### 4.5 Deploy Edge Functions

From your project root:
```
supabase functions deploy payment-intent
supabase functions deploy stripe-webhook
```

## Key Screens 

[▶️ Watch Demo on YouTube](https://youtu.be/KfduQByZijQ)

- **Home**: AI-powered fashion recommendations
- **P2P Marketplace**: Buy/sell pre-owned items
- **AI Screen**: Skin tone analysis and personalized styling
- **Rent**: Designer rental marketplace
- **Orders**: Purchase and sales management
- **Profile**: User settings and seller dashboard

## AI Features Deep Dive

### Skin Tone Matching
- Real-time camera analysis for skin tone detection
- Color palette generation based on skin undertones
- Smart filtering of fashion items by color compatibility
- **CNN-based Color Tone Detection**: Implemented a convolutional neural network achieving **92% accuracy** for precise skin tone classification
- **Color Harmony Algorithm**: Applied color harmony principles to match detected tones with complementary fashion color palettes

### Size Prediction
- Body measurement input and analysis
- Historical fit data correlation
- Brand-specific sizing recommendations
- **Multiclass Linear Regression Model**: Used to predict size categories with **88% accuracy**, incorporating brand-specific sizing variations

### Recommendation Engine
- Collaborative filtering based on similar users
- Content-based filtering using item attributes
- Hybrid approach combining multiple ML techniques
- **Weighted Hybrid Model**: Combined CNN-based skin tone matching and multiclass regression-based size prediction by assigning adaptive weights, integrating results with multiple user interactions and in-app questionnaires to refine personalization


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request







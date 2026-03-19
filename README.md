# ECommerce Front - Next.js Application

A modern e-commerce application built with Next.js using a layered architecture pattern, replicating the functionality and design of the ECommerce.Web ASP.NET Core MVC application.

## Architecture

This project follows a **layered architecture** pattern with clear separation of concerns:

### Layers

1. **Components Layer** (`/components`)
   - Reusable UI components
   - Layout components (Header, CartModal, MainLayout)
   - Page components (HomePage)
   - Presentational components (ProductCard, ProductList, CartItem)
   - Examples: `ProductCard`, `ProductList`, `CartItem`, `Header`, `CartModal`

2. **Services Layer** (`/services`)
   - Business logic and API communication
   - Handles data fetching and manipulation
   - Examples: `ProductService`, `CartService`, `AuthService`, `CheckoutService`, `CategoryService`, `ReviewService`

3. **Models Layer** (`/models`)
   - TypeScript interfaces and type definitions
   - Data structures and contracts matching ECommerce.Web DTOs
   - Examples: `Product`, `User`, `Cart`, `Order`, `Category`, `Payment`

4. **Configuration Layer** (`/config`)
   - Environment configuration
   - Application settings
   - `environment.js` - Centralized configuration

## Features Implemented

### ✅ Core Features
- **Home Page**: Hero carousel, category slider, collection grid, product listing with pagination, reviews section
- **Product Management**: Product listing, product details with size selection, reviews
- **Shopping Cart**: Cart page, cart modal/sidebar, session cart for guests, database cart for logged users
- **Authentication**: Login, Register, Session management
- **Checkout**: Checkout form, payment integration (PhonePe ready)
- **Collections**: Category-based product pages (Kurta, KurtaSet, Kurti, Top, Dress, CoOrdSet)
- **Navigation**: Responsive header with dropdowns, cart icon with count

### ✅ Pages Created
- `/` - Home page with all sections
- `/account/login` - User login
- `/account/register` - User registration
- `/cart` - Shopping cart page
- `/checkout` - Checkout page (ready for implementation)
- `/collection/[type]` - Collection pages (ready for implementation)
- `/collection/details/[id]` - Product detail page (ready for implementation)

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with MainLayout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── account/                 # Authentication pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── cart/                    # Cart page
│   │   └── page.tsx
│   └── checkout/                # Checkout (ready)
│       └── page.tsx
├── components/                  # UI Components layer
│   ├── Layout/                  # Layout components
│   │   ├── Header.tsx          # Main navigation header
│   │   ├── CartModal.tsx       # Sidebar cart modal
│   │   └── MainLayout.tsx      # Main layout wrapper
│   ├── Home/                   # Home page components
│   │   └── HomePage.tsx        # Complete home page
│   ├── ProductCard.tsx         # Product card component
│   ├── ProductList.tsx         # Product listing component
│   └── CartItem.tsx            # Cart item component
├── services/                    # Business logic layer
│   ├── ProductService.ts       # Product operations
│   ├── CartService.ts          # Cart operations
│   ├── AuthService.ts          # Authentication
│   ├── CheckoutService.ts      # Checkout operations
│   ├── CategoryService.ts      # Category operations
│   ├── ReviewService.ts        # Review operations
│   └── index.ts                # Barrel export
├── models/                      # Data models layer
│   ├── Product.ts              # Product interfaces
│   ├── User.ts                 # User/Auth interfaces
│   ├── Cart.ts                 # Cart interfaces
│   ├── Order.ts                # Order interfaces
│   ├── Category.ts             # Category interfaces
│   ├── Payment.ts              # Payment interfaces
│   └── index.ts                # Barrel export
├── config/                      # Configuration layer
│   └── environment.js          # Environment configuration
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Yashangi
NODE_ENV=development
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Integration

The application is designed to work with the ECommerce.Web backend API. Update the `NEXT_PUBLIC_API_BASE_URL` in your `.env.local` to point to your backend API.

### Expected API Endpoints

- `GET /products` - Get products with pagination
- `GET /products/:id` - Get product details
- `GET /products?categoryId=:id` - Get products by category
- `GET /cart/getcartdata` - Get cart data (AJAX)
- `GET /cart/count` - Get cart count
- `POST /cart/add` - Add to cart
- `POST /cart/update` - Update cart item
- `POST /cart/remove` - Remove cart item
- `POST /account/login` - User login
- `POST /account/register` - User registration
- `POST /checkout/submit` - Submit checkout

## Design Matching

The application replicates the design and functionality of ECommerce.Web:
- Same header/navigation structure
- Same cart modal design
- Same home page layout (hero, categories, collections, products)
- Same product card design
- Same cart page layout
- Bootstrap 5 styling
- Font Awesome icons
- Owl Carousel for sliders

## Environment Configuration

The `config/environment.js` file centralizes all environment variables and configuration. Update it to add new configuration options.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Benefits

- **Separation of Concerns**: Each layer has a specific responsibility
- **Maintainability**: Easy to locate and modify code
- **Testability**: Services and components can be tested independently
- **Scalability**: Easy to add new features following the same pattern
- **Type Safety**: TypeScript models ensure type safety across layers
- **API Compatibility**: Models match ECommerce.Web DTOs for seamless integration

## Next Steps

1. Implement product detail page with size selection and reviews
2. Complete checkout page with payment integration
3. Implement collection pages for each category
4. Add CSS styling to match the original design exactly
5. Add image assets to `/public/assets/images/`
6. Connect to your backend API


# [YMGS Pharmacy](https://ymgs-frontend.vercel.app/) &middot; [![Author Sanskar Gupta](https://img.shields.io/badge/Author-Sanskar-%3C%3E)](https://www.linkedin.com/in/sanskar-gupta-12476423b/)  
[![GitHub](https://img.shields.io/badge/GitHub-%3C%3E)](https://github.com/Sanskargupta0/YMGS-Frontend)  
[![React](https://img.shields.io/badge/React-%3C%3E)](https://react.dev/)  
[![Vite](https://img.shields.io/badge/Vite-%3C%3E)](https://vitejs.dev/)  
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%3C%3E)](https://tailwindcss.com/)

## 📝 Project Description

YMGS Pharmacy is a modern, full-featured e-commerce platform for online medicine and healthcare product delivery. Built with React and Vite, this frontend application provides a seamless shopping experience for customers to browse, search, and purchase medicines, health supplements, and medical supplies. The platform features a responsive design, dark/light theme support, multiple payment methods, guest checkout functionality, and comprehensive order management capabilities.

## ⚙️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 3
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **UI Components**: Lucide React (Icons)
- **Carousel/Slider**: Swiper.js
- **Notifications**: React Toastify
- **Development**: ESLint, PostCSS

## 🔋 Features

👉 **Complete E-commerce Experience**: Browse and purchase medicines, health supplements, and medical supplies with a user-friendly interface designed specifically for healthcare products.

👉 **Advanced Product Catalog**: 
- Smart search and filtering by category, subcategory, and keywords
- Product pagination with customizable results per page
- Featured products and bestsellers showcase
- Detailed product pages with descriptions, pricing, and availability

👉 **User Authentication & Management**: 
- Secure user registration and login system
- Profile management and saved addresses
- Order history and tracking
- Guest checkout option for quick purchases

👉 **Flexible Shopping Cart**: 
- Add/remove items with quantity controls
- Support for different product packages and pricing tiers
- Minimum order quantity validation
- Real-time cart total calculations

👉 **Multiple Payment Methods**: 
- Credit/Debit card payments
- Razorpay integration for Indian users
- Stripe integration for international payments
- PayPal support
- Cryptocurrency payments (Bitcoin, Ethereum, etc.)
- Western Union support
- Manual payment processing

👉 **Smart Checkout System**: 
- Guest checkout for non-registered users
- Saved addresses for registered users
- Separate billing and delivery addresses
- Coupon code support with discount calculations
- Order notes and special instructions

👉 **Comprehensive Order Management**: 
- Real-time order tracking and status updates
- Order verification for payment processing
- Detailed order history with payment information
- Support for various order statuses

👉 **Blog & Content Management**: 
- Health and wellness blog section
- Paginated blog listings
- Detailed blog post view
- SEO-friendly blog URLs

👉 **Customer Support Features**: 
- Contact form with inquiry management
- WhatsApp integration for instant support
- Testimonials and reviews section
- FAQ and policy pages

👉 **Modern UI/UX**: 
- Responsive design for all device sizes
- Dark/light theme toggle with persistence
- Loading states and skeleton loaders
- Toast notifications for user feedback
- Smooth animations and transitions

👉 **Performance Optimized**: 
- Image optimization with lazy loading
- Component-based architecture
- Efficient state management with Context API
- Optimized build with Vite

## 🏗️ System Architecture

### Frontend Architecture

The application follows a modern React architecture with:

1. **Component-Based Structure**: Modular, reusable components for maintainability
2. **Context API**: Centralized state management for cart, theme, and user data
3. **React Router**: Client-side routing for single-page application experience
4. **API Integration**: RESTful API communication with the backend server

### Integration with Backend Systems

This frontend integrates with two main backend systems:

1. **[YMGS Backend](https://github.com/Sanskargupta0/YMGS-Backend)**: Main API server handling:
   - Product catalog management
   - User authentication and profiles
   - Order processing and payment integration
   - Blog content management
   - Contact form handling

2. **[YMGS Admin Panel](https://github.com/Sanskargupta0/YMGS-Admin)**: Administrative interface for:
   - Product inventory management
   - Order fulfillment and tracking
   - User management
   - Content management (blogs, testimonials)
   - Analytics and reporting

### Data Flow

```
Frontend (React) ↔ Backend API ↔ Database
                     ↕
                Admin Panel
```

## 🚀 Quick Start

Follow these steps to set up the project locally on your machine.

### Prerequisites

Make sure you have the following installed:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (version 18.x or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Cloning the Repository

```bash
git clone https://github.com/Sanskargupta0/YMGS-Frontend.git
cd YMGS-Frontend
```

### Installation

Install dependencies using npm:

```bash
npm install
```

or using yarn:

```bash
yarn install
```

### Environment Setup

1. Create a `.env` file in the root directory by copying from `.env.example`:

```bash
cp .env.example .env
```

2. Fill in all the required environment variables in your `.env` file. See the [Environment Variables](#environment-variables) section below for detailed instructions.

### Required Backend Setup

Before running the frontend, ensure you have the backend services running:

1. **Set up the [YMGS Backend](https://github.com/Sanskargupta0/YMGS-Backend)**:
   - Clone and set up the backend repository
   - Configure the database and environment variables
   - Start the backend server (typically runs on port 4000)

2. **Set up the [YMGS Admin Panel](https://github.com/Sanskargupta0/YMGS-Admin)** (optional for basic functionality):
   - Clone and set up the admin panel repository
   - Use it to manage products, orders, and content

### Running the Application

1. **Start the development server**:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

The frontend will automatically connect to your backend API using the `VITE_BACKEND_URL` environment variable.

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Backend Integration
- `VITE_BACKEND_URL`: URL of your YMGS backend server (e.g., `http://localhost:4000` for local development)

### Payment Integration
- `VITE_RAZORPAY_KEY_ID`: Your Razorpay key ID for Indian payment processing

### Example `.env` file:
```env
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
```

**Note**: The backend handles most configuration including Stripe keys, database connections, and other sensitive information. The frontend only needs the backend URL and Razorpay public key.

## 🎯 Usage Guide

### For Testing & Demo

You can test the application using these demo credentials:

**Demo User Account:**
- **Email**: `Sanskar362002@gmail.com`
- **Password**: `Qwerty123`

**Test Coupon Code:**
- **Coupon**: `SUMMER2025` (for testing discount functionality)

### For Customers

1. **Browse Products**: Visit the products page to explore available medicines and health products
2. **Search & Filter**: Use the search bar and filters to find specific products
3. **Add to Cart**: Select products and add them to your shopping cart
4. **Checkout**: 
   - Register/login for a personalized experience, or
   - Use guest checkout for quick purchases
5. **Payment**: Choose from multiple payment methods available
6. **Track Orders**: Monitor your order status through the orders page

### For Administrators

1. Use the [YMGS Admin Panel](https://github.com/Sanskargupta0/YMGS-Admin) to:
   - Manage product inventory
   - Process and fulfill orders
   - Handle customer inquiries
   - Update blog content and testimonials

## 🏗️ Project Structure

```
YMGS-Frontend/
├── public/                       # Static assets
│   └── vite.svg                 # Favicon
├── src/                         # Source code
│   ├── assets/                  # Images and static files
│   │   ├── assets.js           # Asset exports
│   │   └── *.png,*.jpg         # Image files
│   ├── components/              # Reusable UI components
│   │   ├── BestSeller.jsx      # Featured products section
│   │   ├── CartTotal.jsx       # Cart summary component
│   │   ├── Feature.jsx         # Features showcase
│   │   ├── Footer.jsx          # Site footer
│   │   ├── Hero.jsx            # Homepage hero section
│   │   ├── Navbar.jsx          # Navigation bar
│   │   ├── ProductItem.jsx     # Product card component
│   │   ├── SearchBar.jsx       # Search functionality
│   │   ├── ThemeSwitcher.jsx   # Dark/light theme toggle
│   │   ├── Testimonials.jsx    # Customer reviews
│   │   └── WhatsAppButton.jsx  # WhatsApp integration
│   ├── context/                 # React Context providers
│   │   ├── ShopContext.jsx     # Main app state management
│   │   └── ThemeContext.jsx    # Theme state management
│   ├── pages/                   # Main application pages
│   │   ├── About.jsx           # About us page
│   │   ├── BlogDetail.jsx      # Individual blog post
│   │   ├── Blogs.jsx           # Blog listing page
│   │   ├── Cart.jsx            # Shopping cart page
│   │   ├── Collection.jsx      # Products listing page
│   │   ├── Contact.jsx         # Contact form page
│   │   ├── GuestCheckout.jsx   # Guest checkout process
│   │   ├── Home.jsx            # Homepage
│   │   ├── Login.jsx           # User authentication
│   │   ├── Orders.jsx          # Order history and tracking
│   │   ├── PlaceOrder.jsx      # Checkout for registered users
│   │   ├── Policy.jsx          # Terms and policies
│   │   ├── Product.jsx         # Individual product page
│   │   └── Verify.jsx          # Payment verification
│   ├── App.jsx                  # Main application component
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles
├── eslint.config.js             # ESLint configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vercel.json                 # Vercel deployment config
└── vite.config.js              # Vite build configuration
```

## 🔄 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add your environment variables in Vercel dashboard
3. **Deploy**: Vercel will automatically deploy on every push to main branch

### Manual Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Deploy the `dist` folder** to your hosting provider

### Environment Variables for Production

Make sure to set the following in your production environment:
- `VITE_BACKEND_URL`: Your production backend URL
- `VITE_RAZORPAY_KEY_ID`: Your production Razorpay key

## 🔒 Security Features

- **Input Validation**: Client-side form validation with server-side verification
- **Secure Authentication**: Token-based authentication with the backend
- **Payment Security**: Secure payment processing through trusted gateways
- **Data Protection**: Sensitive information handled securely through backend APIs
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: User preference with localStorage persistence
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: User-friendly error messages and retry mechanisms
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Optimized images and lazy loading

## 🔧 API Integration

The frontend communicates with the backend through RESTful APIs:

### Main API Endpoints Used:
- `/api/product/user/list` - Product catalog
- `/api/cart/*` - Shopping cart operations
- `/api/order/*` - Order processing and management
- `/api/user/*` - User authentication and profile
- `/api/blog/*` - Blog content
- `/api/contact` - Contact form submissions

### Payment Integration:
- **Razorpay**: For Indian market payments
- **Stripe**: For international payments
- **Manual Processing**: For alternative payment methods

## 🚦 Troubleshooting

### Common Issues

1. **Backend Connection Failed**: 
   - Verify `VITE_BACKEND_URL` is set correctly
   - Ensure backend server is running
   - Check network connectivity

2. **Payment Integration Issues**:
   - Verify Razorpay key is valid
   - Check backend payment configuration
   - Ensure SSL is enabled for production

3. **Build Errors**:
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript/JavaScript syntax errors
   - Verify all environment variables are set

4. **Theme Not Persisting**:
   - Check localStorage availability
   - Verify ThemeContext is properly wrapped around components

### Performance Tips

- Enable image optimization in production
- Use proper caching headers for static assets
- Monitor bundle size and optimize if necessary
- Implement proper error boundaries

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with sidebar navigation
- **Tablet**: Adapted layout with touch-friendly interactions
- **Mobile**: Optimized mobile experience with hamburger menu and touch gestures

### 📸 Screenshots

#### Home Page
![Home Page](/screenshots/home-page.png)

#### Products Collection
![Products Collection](/screenshots/products-collection.png)

#### Product Detail Page
![Product Detail](/screenshots/product-detail.png)

#### Shopping Cart
![Shopping Cart](/screenshots/shopping-cart.png)

#### Checkout Page
![Checkout Page](/screenshots/checkout-page.png)

#### Guest Checkout
![Guest Checkout](/screenshots/guest-checkout.png)

#### Order Management
![Order Management](/screenshots/order-management.png)

#### Blog Section
![Blog Section](/screenshots/blog-section.png)

#### Contact Page
![Contact Page](/screenshots/contact-page.png)

#### About Us Page
![About Us](/screenshots/about-us.png)

#### Dark Theme
![Dark Theme](/screenshots/dark-theme.png)

#### Mobile View
![Mobile View](/screenshots/mobile-view.png)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the [backend repository](https://github.com/Sanskargupta0/YMGS-Backend) for API-related issues
3. Check the [admin panel repository](https://github.com/Sanskargupta0/YMGS-Admin) for management-related questions
4. Open an issue on GitHub

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Related Repositories

- **[YMGS Backend](https://github.com/Sanskargupta0/YMGS-Backend)**: Main API server and business logic
- **[YMGS Admin Panel](https://github.com/Sanskargupta0/YMGS-Admin)**: Administrative interface for managing the platform

---

Built with ❤️ by [Sanskar Gupta](https://www.linkedin.com/in/sanskar-gupta-12476423b/)

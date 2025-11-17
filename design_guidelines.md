# Design Guidelines: Clinic Administration System - Dashboard

## Design Approach
**System-Based Approach:** Material Design principles adapted for healthcare administration
- Clean, professional interface optimized for daily clinical operations
- Information-dense layouts with clear hierarchy
- Focus on efficiency and quick access to critical functions

## Layout System
**Spacing Framework:** Use Tailwind units of 3, 4, 6, and 8 for consistent rhythm
- Container padding: p-6 for cards, p-8 for main content areas
- Element spacing: gap-4 for grids, space-y-6 for sections
- Tight spacing (p-3, gap-3) for data-dense tables and lists

**Grid Structure:**
- Two-column layout: Sidebar (w-64) + Main content area (flex-1)
- Dashboard cards: 3-column grid on desktop (grid-cols-3), 2-column on tablet, stack on mobile
- Statistics overview: 4-column grid for quick metrics (grid-cols-4 responsive to grid-cols-2 to grid-cols-1)

## Typography
**Hierarchy:**
- Page headers: text-2xl font-semibold
- Card titles: text-lg font-medium
- Metrics/numbers: text-3xl font-bold for key statistics
- Body text: text-base for general content
- Labels: text-sm font-medium
- Captions: text-xs for timestamps and metadata

## Component Library

**Navigation Sidebar:**
- Fixed left sidebar with clinic logo at top
- Icon + label navigation items
- Active state highlighting with background fill
- Collapsible on mobile

**Dashboard Cards:**
- Elevated cards with subtle shadow (shadow-md)
- Header section with title and action button/icon
- Content area with appropriate padding
- Consistent border radius (rounded-lg)

**Statistics Widgets:**
- Large number display with label below
- Trend indicator (up/down arrow with percentage)
- Icon representing metric type
- Compact design for dashboard overview

**Data Tables:**
- Clean table design with alternating row backgrounds
- Fixed header on scroll for long lists
- Action buttons/icons in rightmost column
- Sort indicators in column headers
- Hover states for rows

**Action Buttons:**
- Primary actions: Larger buttons (px-6 py-3) with medium font weight
- Secondary actions: Outlined style, same size
- Icon buttons: Circular or square, p-2, for table actions
- Floating action button (FAB) for primary create action (bottom-right)

**Alert/Notification Panel:**
- Fixed-width panel or card showing urgent items
- Color-coded indicators for priority (without specifying actual colors)
- Compact list format with timestamps
- Dismissible items with close button

**Charts & Visualizations:**
- Use Chart.js or similar library via CDN
- Line charts for trends over time
- Bar charts for comparative metrics
- Donut/pie charts for distribution
- Consistent sizing within dashboard grid

## Page Structure

**Main Dashboard Layout:**
1. Top bar with search, notifications icon, user profile dropdown
2. Sidebar navigation with key modules (Patients, Appointments, Staff, Inventory, Reports)
3. Main content area:
   - Welcome header with date
   - 4-column quick stats row (Today's appointments, Active patients, Pending tasks, etc.)
   - 2-column section: Recent appointments table + Alerts/notifications panel
   - 3-column section: Mini charts showing weekly trends

**Module Access Cards:**
- Large clickable cards for main system modules
- Icon at top, title, brief description
- Subtle hover elevation effect
- Grid layout (3 columns desktop, 2 tablet, 1 mobile)

## Accessibility Standards
- Clear focus indicators for keyboard navigation
- Semantic HTML for screen readers
- Adequate contrast ratios throughout
- Consistent interactive element sizing (minimum 44x44px touch targets)
- Label all form inputs and interactive elements
- ARIA labels for icon-only buttons

## Images
**Logo/Branding:** Clinic logo in sidebar header (approximately 150x50px)
**Icons:** Use Material Icons via CDN for all UI icons - medical symbols for modules (stethoscope, calendar, users, chart, etc.)
**No hero images** - This is a functional dashboard, not a marketing page

## Animations
Minimal and purposeful only:
- Smooth sidebar collapse/expand transition
- Subtle fade-in for loaded data
- Card hover elevation (avoid excessive motion)

## Special Considerations
- Ensure tables are scannable with proper alignment (numbers right-aligned, text left-aligned)
- Use badge components for status indicators (Active, Pending, Completed)
- Include breadcrumb navigation for deep pages
- Implement responsive behavior: sidebar converts to hamburger menu on mobile
- Data export buttons placed in table headers or card actions
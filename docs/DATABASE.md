# Database Design

## MongoDB Collections

### users
Staff authentication and RBAC.

| Field | Type | Description |
|-------|------|-------------|
| name | String | Full name |
| email | String | Unique, lowercase |
| password | String | bcrypt hashed |
| role | Enum | super_admin, restaurant_admin, manager, cashier, chef, waiter |
| phone | String | Contact |
| avatar | String | Profile image URL |
| isActive | Boolean | Account status |
| refreshToken | String | JWT refresh token |

### categories
Menu categories (Breakfast, Lunch, Dinner, etc.)

### foods
Menu items with pricing, images, availability.

| Field | Type | Description |
|-------|------|-------------|
| name | String | Food name |
| price | Number | Base price |
| discount | Number | Percentage discount |
| category | ObjectId | ref: Category |
| images | [String] | Cloudinary URLs |
| isAvailable | Boolean | Stock availability |
| isPopular | Boolean | Popular badge |
| isFeatured | Boolean | Featured item |

### tables
Restaurant tables with QR codes.

| Field | Type | Description |
|-------|------|-------------|
| tableNumber | String | Unique (T01, T02) |
| capacity | Number | Seat count |
| status | Enum | available, reserved, occupied |
| qrCode | String | Base64 QR data URL |
| qrCodeUrl | String | Menu URL |

### orders
Customer and staff orders.

| Field | Type | Description |
|-------|------|-------------|
| orderNumber | String | Auto-generated |
| orderType | Enum | dine_in, walk_in, takeaway |
| table | ObjectId | ref: Table |
| tableNumber | String | Denormalized |
| customer | ObjectId | ref: Customer |
| items | [OrderItem] | Embedded subdocuments |
| subtotal, tax, discount, total | Number | Pricing |
| status | Enum | pending → completed |
| paymentStatus | Enum | unpaid, partial, paid |

### orderItems (embedded in orders)
| Field | Type | Description |
|-------|------|-------------|
| food | ObjectId | ref: Food |
| name | String | Snapshot |
| price | Number | Snapshot price |
| quantity | Number | Item count |
| notes | String | Cooking notes |
| subtotal | Number | price × quantity |

### customers
Walk-in and QR order customers (no auth).

### payments
Payment records with invoice numbers.

| Field | Type | Description |
|-------|------|-------------|
| order | ObjectId | ref: Order |
| amount | Number | Paid amount |
| method | Enum | cash, evc_plus, sahal, premier_wallet, credit_card |
| splitDetails | [Object] | Split bill breakdown |
| invoiceNumber | String | Auto-generated |

### reservations
Table reservations.

### inventory
Ingredient stock management with low-stock alerts.

### employees
Extended staff profiles linked to users.

### notifications
Real-time notification records.

### suppliers
Inventory supplier contacts.

### settings
Restaurant configuration (tax rate, hours, branding).

## Indexes

- `users.email` — unique
- `tables.tableNumber` — unique
- `orders.orderNumber` — unique
- `customers.phone` — indexed for lookup
- `payments.invoiceNumber` — unique

## Relationships

```
User 1──1 Employee
User 1──* Food (createdBy)
User 1──* Order (createdBy, assignedChef, assignedWaiter)
User 1──* Payment (processedBy)

Category 1──* Food
Table 1──* Order
Table 1──* Reservation
Customer 1──* Order
Order 1──* Payment
Supplier 1──* Inventory
Food *──* Customer (favoriteFoods)
```

See `docs/ER_DIAGRAM.md` for visual diagram.


# Installations

```bash
npm install (in root folder)

cd client
npm install

cd server
npm install
```

# Database Queries

### Menus Table

```sql
CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);
```

### Categories Table

```sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  menu_id INTEGER REFERENCES menus(id),
  UNIQUE(menu_id, slug)
);
```

### Dishes Table

```sql
CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  model_url TEXT,
  model_url_usdz TEXT,
  menu_id INTEGER REFERENCES menus(id),
  category_id INTEGER REFERENCES categories(id)
);
```

### Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
```

### Orders table

```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_details JSONB NOT NULL,
  order_items JSONB NOT NULL,    
  total_amount DECIMAL(10, 2) NOT NULL,
  order_status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Sample Inserts

#### Menus

```sql
INSERT INTO menus (name, slug) VALUES
('Основное меню', 'main'),
('Барное меню', 'bar');
```

#### Main Menu Categories

```sql
INSERT INTO categories (name, slug, position, menu_id) VALUES
('Салаты', 'salads', 1, 1),
('Пицца', 'pizza', 2, 1);
```

#### Bar Menu Categories

```sql
INSERT INTO categories (name, slug, position, menu_id) VALUES
('Холодные напитки', 'cold-drinks', 1, 2),
('Лимонады', 'lemonades', 2, 2);
```

#### Dishes Under Main Menu

```sql
INSERT INTO dishes (name, description, price, menu_id, category_id)
VALUES
('Цезарь', 'Салат с курицей и соусом', 2500, 1, 1),
('Маргарита', 'Пицца с моцареллой и томатами', 3200, 1, 2);
```

#### Dishes Under Bar Menu

```sql
INSERT INTO dishes (name, description, price, menu_id, category_id)
VALUES
('Coca-Cola', 'Газированный напиток', 1000, 2, 3),
('Лимонад мятный', 'Лимонад с мятой и лаймом', 1500, 2, 4);
```

export const schema = `
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6b7280',
    icon TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Vendors/Sources table
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Main items table
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,

    -- Tracking mode: 'quantity' or 'individual'
    tracking_mode TEXT NOT NULL DEFAULT 'quantity'
        CHECK (tracking_mode IN ('quantity', 'individual')),

    -- Quantity tracking fields (used when tracking_mode = 'quantity')
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pcs',

    -- Individual tracking fields (used when tracking_mode = 'individual')
    serial_number TEXT,
    asset_tag TEXT,
    condition TEXT DEFAULT 'working'
        CHECK (condition IN ('new', 'working', 'needs_repair', 'broken', 'retired')),
    purchase_date TEXT,
    warranty_expiry TEXT,

    -- Common fields
    location TEXT,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,

    -- Specifications (JSON string for flexibility)
    specifications TEXT DEFAULT '{}',

    -- Purchase/sourcing info
    purchase_price REAL,
    purchase_currency TEXT DEFAULT 'USD',
    purchase_url TEXT,
    datasheet_url TEXT,

    -- Metadata
    notes TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    is_primary INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Full-text search virtual table for items
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
    name,
    description,
    location,
    notes,
    tags,
    specifications,
    content='items',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, name, description, location, notes, tags, specifications)
    VALUES (NEW.rowid, NEW.name, NEW.description, NEW.location, NEW.notes, NEW.tags, NEW.specifications);
END;

CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, name, description, location, notes, tags, specifications)
    VALUES ('delete', OLD.rowid, OLD.name, OLD.description, OLD.location, OLD.notes, OLD.tags, OLD.specifications);
END;

CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, name, description, location, notes, tags, specifications)
    VALUES ('delete', OLD.rowid, OLD.name, OLD.description, OLD.location, OLD.notes, OLD.tags, OLD.specifications);
    INSERT INTO items_fts(rowid, name, description, location, notes, tags, specifications)
    VALUES (NEW.rowid, NEW.name, NEW.description, NEW.location, NEW.notes, NEW.tags, NEW.specifications);
END;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_vendor ON items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
CREATE INDEX IF NOT EXISTS idx_items_tracking_mode ON items(tracking_mode);
CREATE INDEX IF NOT EXISTS idx_items_quantity_low ON items(quantity, min_quantity)
    WHERE tracking_mode = 'quantity';
CREATE INDEX IF NOT EXISTS idx_images_item ON images(item_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON images(item_id, is_primary);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS items_updated_at
    AFTER UPDATE ON items
    FOR EACH ROW
BEGIN
    UPDATE items SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS categories_updated_at
    AFTER UPDATE ON categories
    FOR EACH ROW
BEGIN
    UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS vendors_updated_at
    AFTER UPDATE ON vendors
    FOR EACH ROW
BEGIN
    UPDATE vendors SET updated_at = datetime('now') WHERE id = NEW.id;
END;
`;

// Default categories for seeding
export const defaultCategories = [
  { name: 'Microcontrollers', description: 'Arduino, ESP32, Raspberry Pi, STM32, etc.', color: '#3b82f6', icon: 'cpu' },
  { name: 'Sensors', description: 'Temperature, Motion, Light, Pressure, etc.', color: '#10b981', icon: 'activity' },
  { name: 'Displays', description: 'LCD, OLED, LED matrices, E-Paper', color: '#8b5cf6', icon: 'monitor' },
  { name: 'Passive Components', description: 'Resistors, Capacitors, Inductors', color: '#f59e0b', icon: 'circle' },
  { name: 'Connectors', description: 'Headers, JST, USB, Barrel jacks', color: '#6366f1', icon: 'link' },
  { name: 'Power', description: 'Batteries, Regulators, Chargers, Power supplies', color: '#ef4444', icon: 'zap' },
  { name: 'Audio', description: 'Speakers, Microphones, Amplifiers', color: '#ec4899', icon: 'volume-2' },
  { name: 'Motors & Actuators', description: 'Servos, Steppers, DC motors, Solenoids', color: '#14b8a6', icon: 'settings' },
  { name: 'Mechanical', description: 'Bearings, Gears, Belts, Linear rails', color: '#64748b', icon: 'tool' },
  { name: 'Fasteners', description: 'Screws, Nuts, Bolts, Standoffs, Washers', color: '#78716c', icon: 'hash' },
  { name: 'Tools', description: 'Soldering, Hand tools, Measurement', color: '#0891b2', icon: 'wrench' },
  { name: '3D Printing', description: 'Filament, Parts, Accessories', color: '#a855f7', icon: 'box' },
  { name: 'Raw Materials', description: 'Wire, Tubing, Sheets, Rods', color: '#84cc16', icon: 'layers' },
  { name: 'Communication', description: 'RF, WiFi, Bluetooth, LoRa modules', color: '#06b6d4', icon: 'wifi' },
  { name: 'Storage & Cases', description: 'Enclosures, Bags, Boxes, Organizers', color: '#f97316', icon: 'archive' },
];

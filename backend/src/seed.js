const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'travel_planner',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createDatabase() {
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const dbName = process.env.DB_NAME || 'travel_planner';
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
  } finally {
    await adminPool.end();
  }
}

async function dropTables() {
  const dropQuery = `
    DROP TABLE IF EXISTS ai_history CASCADE;
    DROP TABLE IF EXISTS notes CASCADE;
    DROP TABLE IF EXISTS photos CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS emergency_contacts CASCADE;
    DROP TABLE IF EXISTS travel_tips CASCADE;
    DROP TABLE IF EXISTS packing_lists CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS budgets CASCADE;
    DROP TABLE IF EXISTS restaurants CASCADE;
    DROP TABLE IF EXISTS transportation CASCADE;
    DROP TABLE IF EXISTS accommodations CASCADE;
    DROP TABLE IF EXISTS activities CASCADE;
    DROP TABLE IF EXISTS destinations CASCADE;
    DROP TABLE IF EXISTS trips CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `;

  try {
    await pool.query(dropQuery);
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error.message);
  }
}

async function createTables() {
  const createTableQueries = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      email_verified BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Trips table
    CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      from_location VARCHAR(255),
      destination VARCHAR(255) NOT NULL,
      start_date DATE,
      end_date DATE,
      budget DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'planning',
      description TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Destinations table
    CREATE TABLE IF NOT EXISTS destinations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(255),
      city VARCHAR(255),
      description TEXT,
      best_time_to_visit VARCHAR(255),
      language VARCHAR(100),
      currency VARCHAR(50),
      timezone VARCHAR(100),
      image_url TEXT,
      rating DECIMAL(2,1),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Activities table
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE,
      time TIME,
      duration VARCHAR(50),
      cost DECIMAL(10,2),
      location VARCHAR(255),
      category VARCHAR(100),
      booking_status VARCHAR(50) DEFAULT 'not_booked',
      booking_reference VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Accommodations table
    CREATE TABLE IF NOT EXISTS accommodations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      address TEXT,
      check_in_date DATE,
      check_out_date DATE,
      price_per_night DECIMAL(10,2),
      total_price DECIMAL(10,2),
      booking_status VARCHAR(50) DEFAULT 'not_booked',
      booking_reference VARCHAR(100),
      amenities TEXT[],
      rating DECIMAL(2,1),
      contact_phone VARCHAR(50),
      contact_email VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Transportation table
    CREATE TABLE IF NOT EXISTS transportation (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      type VARCHAR(100) NOT NULL,
      provider VARCHAR(255),
      departure_location VARCHAR(255),
      arrival_location VARCHAR(255),
      departure_date DATE,
      departure_time TIME,
      arrival_date DATE,
      arrival_time TIME,
      booking_reference VARCHAR(100),
      cost DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'booked',
      seat_info VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Restaurants table
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      cuisine VARCHAR(100),
      address TEXT,
      price_range VARCHAR(50),
      rating DECIMAL(2,1),
      reservation_date DATE,
      reservation_time TIME,
      phone VARCHAR(50),
      website TEXT,
      notes TEXT,
      must_try_dishes TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Budgets table
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      category VARCHAR(100) NOT NULL,
      planned_amount DECIMAL(10,2),
      actual_amount DECIMAL(10,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'USD',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Documents table
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      type VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      document_number VARCHAR(100),
      issue_date DATE,
      expiry_date DATE,
      issuing_country VARCHAR(100),
      notes TEXT,
      file_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Packing lists table
    CREATE TABLE IF NOT EXISTS packing_lists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity INTEGER DEFAULT 1,
      is_packed BOOLEAN DEFAULT FALSE,
      priority VARCHAR(50) DEFAULT 'medium',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Travel tips table
    CREATE TABLE IF NOT EXISTS travel_tips (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      destination VARCHAR(255),
      category VARCHAR(100),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      source VARCHAR(255),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Emergency contacts table
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      relationship VARCHAR(100),
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      address TEXT,
      is_primary BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Reviews table
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      entity_type VARCHAR(100),
      entity_name VARCHAR(255) NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(255),
      content TEXT,
      pros TEXT[],
      cons TEXT[],
      would_recommend BOOLEAN,
      visit_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Photos table
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      url TEXT NOT NULL,
      title VARCHAR(255),
      description TEXT,
      location VARCHAR(255),
      taken_at TIMESTAMP,
      is_favorite BOOLEAN DEFAULT FALSE,
      tags TEXT[],
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- AI History table
    CREATE TABLE IF NOT EXISTS ai_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      feature_type VARCHAR(100) NOT NULL,
      title VARCHAR(500),
      prompt_data JSONB,
      response_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Notes table
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      category VARCHAR(100),
      is_pinned BOOLEAN DEFAULT FALSE,
      color VARCHAR(20) DEFAULT '#ffffff',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQueries);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
    throw error;
  }
}

async function seedData() {
  try {
    // Create demo user
    const hashedPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || 'Demo123!', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password, name) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password = $2, name = $3
       RETURNING id`,
      [process.env.DEMO_EMAIL || 'demo@travelplanner.com', hashedPassword, 'Demo User']
    );
    const userId = userResult.rows[0].id;
    console.log('Demo user created/updated');

    // Seed Trips (15 items)
    const trips = [
      { name: 'Paris Adventure', from_location: 'New York, USA', destination: 'Paris, France', start_date: '2025-06-01', end_date: '2025-06-10', budget: 3500, status: 'planning', description: 'Romantic trip to the City of Lights', image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
      { name: 'Tokyo Exploration', from_location: 'Los Angeles, USA', destination: 'Tokyo, Japan', start_date: '2025-04-01', end_date: '2025-04-14', budget: 5000, status: 'confirmed', description: 'Cherry blossom season adventure', image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf' },
      { name: 'New York City Break', from_location: 'Chicago, USA', destination: 'New York, USA', start_date: '2025-07-15', end_date: '2025-07-22', budget: 4000, status: 'planning', description: 'The Big Apple experience', image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9' },
      { name: 'Bali Retreat', from_location: 'Sydney, Australia', destination: 'Bali, Indonesia', start_date: '2025-08-10', end_date: '2025-08-20', budget: 2500, status: 'planning', description: 'Tropical paradise getaway', image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4' },
      { name: 'London Discovery', from_location: 'New York, USA', destination: 'London, UK', start_date: '2025-09-05', end_date: '2025-09-12', budget: 3000, status: 'confirmed', description: 'Royal British adventure', image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad' },
      { name: 'Barcelona Fiesta', from_location: 'London, UK', destination: 'Barcelona, Spain', start_date: '2025-05-20', end_date: '2025-05-27', budget: 2200, status: 'planning', description: 'Spanish culture and beaches', image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efced' },
      { name: 'Sydney Summer', from_location: 'San Francisco, USA', destination: 'Sydney, Australia', start_date: '2025-12-20', end_date: '2026-01-05', budget: 6000, status: 'planning', description: 'Down Under adventure', image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9' },
      { name: 'Rome History Tour', from_location: 'Berlin, Germany', destination: 'Rome, Italy', start_date: '2025-10-01', end_date: '2025-10-08', budget: 2800, status: 'confirmed', description: 'Ancient history exploration', image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5' },
      { name: 'Dubai Luxury', from_location: 'London, UK', destination: 'Dubai, UAE', start_date: '2025-11-15', end_date: '2025-11-22', budget: 7000, status: 'planning', description: 'Luxury desert experience', image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c' },
      { name: 'Swiss Alps Adventure', from_location: 'Paris, France', destination: 'Zermatt, Switzerland', start_date: '2025-02-10', end_date: '2025-02-17', budget: 4500, status: 'completed', description: 'Skiing and mountain views', image_url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7' },
      { name: 'Greek Islands', from_location: 'Rome, Italy', destination: 'Santorini, Greece', start_date: '2025-07-01', end_date: '2025-07-10', budget: 3200, status: 'planning', description: 'Island hopping paradise', image_url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e' },
      { name: 'Thailand Explorer', from_location: 'Singapore', destination: 'Bangkok, Thailand', start_date: '2025-03-15', end_date: '2025-03-28', budget: 2000, status: 'confirmed', description: 'Southeast Asian adventure', image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365' },
      { name: 'Iceland Northern Lights', from_location: 'Boston, USA', destination: 'Reykjavik, Iceland', start_date: '2025-01-20', end_date: '2025-01-27', budget: 3800, status: 'completed', description: 'Aurora borealis hunting', image_url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67' },
      { name: 'Morocco Discovery', from_location: 'Madrid, Spain', destination: 'Marrakech, Morocco', start_date: '2025-04-20', end_date: '2025-04-28', budget: 1800, status: 'planning', description: 'Desert and medina exploration', image_url: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43' },
      { name: 'Costa Rica Nature', from_location: 'Miami, USA', destination: 'San Jose, Costa Rica', start_date: '2025-06-15', end_date: '2025-06-25', budget: 2600, status: 'planning', description: 'Rainforest and wildlife', image_url: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9' }
    ];

    for (const trip of trips) {
      await pool.query(
        `INSERT INTO trips (user_id, name, from_location, destination, start_date, end_date, budget, status, description, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, trip.name, trip.from_location, trip.destination, trip.start_date, trip.end_date, trip.budget, trip.status, trip.description, trip.image_url]
      );
    }
    console.log('Trips seeded');

    // Seed Destinations (15 items)
    const destinations = [
      { name: 'Paris', country: 'France', city: 'Paris', description: 'The City of Lights, famous for the Eiffel Tower, Louvre, and romantic atmosphere', best_time_to_visit: 'April-June, September-October', language: 'French', currency: 'EUR', timezone: 'CET', rating: 4.8 },
      { name: 'Tokyo', country: 'Japan', city: 'Tokyo', description: 'Ultra-modern city blending tradition with cutting-edge technology', best_time_to_visit: 'March-May, September-November', language: 'Japanese', currency: 'JPY', timezone: 'JST', rating: 4.9 },
      { name: 'New York City', country: 'USA', city: 'New York', description: 'The city that never sleeps, iconic skyline and endless entertainment', best_time_to_visit: 'April-June, September-November', language: 'English', currency: 'USD', timezone: 'EST', rating: 4.7 },
      { name: 'Bali', country: 'Indonesia', city: 'Denpasar', description: 'Tropical paradise with temples, rice terraces, and beautiful beaches', best_time_to_visit: 'April-October', language: 'Indonesian', currency: 'IDR', timezone: 'WITA', rating: 4.6 },
      { name: 'London', country: 'United Kingdom', city: 'London', description: 'Historic royal city with world-class museums and theaters', best_time_to_visit: 'May-September', language: 'English', currency: 'GBP', timezone: 'GMT', rating: 4.7 },
      { name: 'Barcelona', country: 'Spain', city: 'Barcelona', description: 'Gaudi architecture, Mediterranean beaches, and vibrant nightlife', best_time_to_visit: 'May-June, September-October', language: 'Spanish, Catalan', currency: 'EUR', timezone: 'CET', rating: 4.6 },
      { name: 'Sydney', country: 'Australia', city: 'Sydney', description: 'Harbor city famous for the Opera House and beautiful beaches', best_time_to_visit: 'September-November, March-May', language: 'English', currency: 'AUD', timezone: 'AEST', rating: 4.7 },
      { name: 'Rome', country: 'Italy', city: 'Rome', description: 'The Eternal City, ancient ruins, and incredible cuisine', best_time_to_visit: 'April-June, September-October', language: 'Italian', currency: 'EUR', timezone: 'CET', rating: 4.8 },
      { name: 'Dubai', country: 'UAE', city: 'Dubai', description: 'Futuristic city of luxury, desert adventures, and shopping', best_time_to_visit: 'November-March', language: 'Arabic, English', currency: 'AED', timezone: 'GST', rating: 4.5 },
      { name: 'Zermatt', country: 'Switzerland', city: 'Zermatt', description: 'Alpine village with stunning Matterhorn views and world-class skiing', best_time_to_visit: 'December-April, July-August', language: 'German', currency: 'CHF', timezone: 'CET', rating: 4.9 },
      { name: 'Santorini', country: 'Greece', city: 'Fira', description: 'Iconic white-washed buildings and stunning caldera views', best_time_to_visit: 'April-October', language: 'Greek', currency: 'EUR', timezone: 'EET', rating: 4.8 },
      { name: 'Bangkok', country: 'Thailand', city: 'Bangkok', description: 'Vibrant city with ornate temples, bustling markets, and amazing food', best_time_to_visit: 'November-February', language: 'Thai', currency: 'THB', timezone: 'ICT', rating: 4.5 },
      { name: 'Reykjavik', country: 'Iceland', city: 'Reykjavik', description: 'Gateway to glaciers, geysers, and northern lights', best_time_to_visit: 'June-August, September-March for Aurora', language: 'Icelandic', currency: 'ISK', timezone: 'GMT', rating: 4.7 },
      { name: 'Marrakech', country: 'Morocco', city: 'Marrakech', description: 'Exotic medina, colorful souks, and desert adventures', best_time_to_visit: 'March-May, September-November', language: 'Arabic, French', currency: 'MAD', timezone: 'WET', rating: 4.4 },
      { name: 'San Jose', country: 'Costa Rica', city: 'San Jose', description: 'Gateway to rainforests, volcanoes, and incredible biodiversity', best_time_to_visit: 'December-April', language: 'Spanish', currency: 'CRC', timezone: 'CST', rating: 4.5 }
    ];

    for (const dest of destinations) {
      await pool.query(
        `INSERT INTO destinations (user_id, name, country, city, description, best_time_to_visit, language, currency, timezone, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, dest.name, dest.country, dest.city, dest.description, dest.best_time_to_visit, dest.language, dest.currency, dest.timezone, dest.rating]
      );
    }
    console.log('Destinations seeded');

    // Seed Activities (15 items)
    const activities = [
      { name: 'Eiffel Tower Visit', description: 'Visit the iconic iron lattice tower with panoramic views of Paris', date: '2025-06-02', time: '10:00', duration: '3 hours', cost: 26, location: 'Champ de Mars, Paris', category: 'Sightseeing', booking_status: 'confirmed' },
      { name: 'Louvre Museum Tour', description: 'Explore the world\'s largest art museum and see the Mona Lisa', date: '2025-06-03', time: '09:00', duration: '4 hours', cost: 17, location: 'Louvre, Paris', category: 'Culture', booking_status: 'confirmed' },
      { name: 'Seine River Cruise', description: 'Evening dinner cruise along the Seine River', date: '2025-06-04', time: '19:00', duration: '2 hours', cost: 85, location: 'Port de la Bourdonnais', category: 'Entertainment', booking_status: 'booked' },
      { name: 'Senso-ji Temple Visit', description: 'Explore Tokyo\'s oldest Buddhist temple', date: '2025-04-02', time: '08:00', duration: '2 hours', cost: 0, location: 'Asakusa, Tokyo', category: 'Culture', booking_status: 'not_booked' },
      { name: 'Shibuya Crossing Experience', description: 'Experience the world\'s busiest pedestrian crossing', date: '2025-04-03', time: '18:00', duration: '1 hour', cost: 0, location: 'Shibuya, Tokyo', category: 'Sightseeing', booking_status: 'not_booked' },
      { name: 'Tokyo Skytree', description: 'Visit the tallest tower in Japan for amazing views', date: '2025-04-04', time: '14:00', duration: '2 hours', cost: 23, location: 'Sumida, Tokyo', category: 'Sightseeing', booking_status: 'booked' },
      { name: 'Statue of Liberty Tour', description: 'Ferry ride and visit to the iconic American landmark', date: '2025-07-16', time: '09:00', duration: '4 hours', cost: 24, location: 'Liberty Island, NY', category: 'Sightseeing', booking_status: 'confirmed' },
      { name: 'Central Park Bike Tour', description: 'Guided bike tour through Central Park', date: '2025-07-17', time: '10:00', duration: '3 hours', cost: 45, location: 'Central Park, Manhattan', category: 'Outdoor', booking_status: 'booked' },
      { name: 'Broadway Show', description: 'Evening performance of The Lion King', date: '2025-07-18', time: '20:00', duration: '3 hours', cost: 150, location: 'Minskoff Theatre, Broadway', category: 'Entertainment', booking_status: 'confirmed' },
      { name: 'Ubud Rice Terraces', description: 'Trek through the famous Tegallalang Rice Terraces', date: '2025-08-12', time: '08:00', duration: '4 hours', cost: 15, location: 'Tegallalang, Ubud', category: 'Nature', booking_status: 'not_booked' },
      { name: 'Uluwatu Temple Sunset', description: 'Watch the Kecak fire dance at sunset', date: '2025-08-14', time: '17:00', duration: '3 hours', cost: 20, location: 'Uluwatu, Bali', category: 'Culture', booking_status: 'booked' },
      { name: 'Bali Cooking Class', description: 'Learn to make traditional Balinese dishes', date: '2025-08-15', time: '09:00', duration: '5 hours', cost: 55, location: 'Ubud, Bali', category: 'Food', booking_status: 'confirmed' },
      { name: 'Tower of London', description: 'Explore the historic castle and see the Crown Jewels', date: '2025-09-06', time: '10:00', duration: '3 hours', cost: 30, location: 'Tower Hill, London', category: 'History', booking_status: 'booked' },
      { name: 'British Museum', description: 'Free visit to one of the world\'s greatest museums', date: '2025-09-07', time: '10:00', duration: '4 hours', cost: 0, location: 'Bloomsbury, London', category: 'Culture', booking_status: 'not_booked' },
      { name: 'London Eye', description: 'Giant observation wheel with city views', date: '2025-09-08', time: '16:00', duration: '1 hour', cost: 35, location: 'South Bank, London', category: 'Sightseeing', booking_status: 'booked' }
    ];

    for (const activity of activities) {
      await pool.query(
        `INSERT INTO activities (user_id, name, description, date, time, duration, cost, location, category, booking_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, activity.name, activity.description, activity.date, activity.time, activity.duration, activity.cost, activity.location, activity.category, activity.booking_status]
      );
    }
    console.log('Activities seeded');

    // Seed Accommodations (15 items)
    const accommodations = [
      { name: 'Hotel Le Marais', type: 'Hotel', address: '12 Rue de Turenne, 75003 Paris', check_in_date: '2025-06-01', check_out_date: '2025-06-10', price_per_night: 180, total_price: 1620, booking_status: 'confirmed', rating: 4.5 },
      { name: 'Park Hyatt Tokyo', type: 'Luxury Hotel', address: '3-7-1-2 Nishi Shinjuku, Tokyo', check_in_date: '2025-04-01', check_out_date: '2025-04-14', price_per_night: 450, total_price: 5850, booking_status: 'confirmed', rating: 4.9 },
      { name: 'The Standard High Line', type: 'Boutique Hotel', address: '848 Washington St, New York', check_in_date: '2025-07-15', check_out_date: '2025-07-22', price_per_night: 320, total_price: 2240, booking_status: 'confirmed', rating: 4.6 },
      { name: 'Four Seasons Bali', type: 'Resort', address: 'Jimbaran Bay, Bali', check_in_date: '2025-08-10', check_out_date: '2025-08-20', price_per_night: 550, total_price: 5500, booking_status: 'pending', rating: 4.8 },
      { name: 'The Savoy', type: 'Luxury Hotel', address: 'Strand, London WC2R 0EZ', check_in_date: '2025-09-05', check_out_date: '2025-09-12', price_per_night: 500, total_price: 3500, booking_status: 'confirmed', rating: 4.9 },
      { name: 'Hotel Arts Barcelona', type: 'Hotel', address: 'Carrer de la Marina, Barcelona', check_in_date: '2025-05-20', check_out_date: '2025-05-27', price_per_night: 280, total_price: 1960, booking_status: 'confirmed', rating: 4.7 },
      { name: 'Park Hyatt Sydney', type: 'Luxury Hotel', address: '7 Hickson Rd, The Rocks, Sydney', check_in_date: '2025-12-20', check_out_date: '2026-01-05', price_per_night: 420, total_price: 6720, booking_status: 'pending', rating: 4.8 },
      { name: 'Hotel de Russie', type: 'Boutique Hotel', address: 'Via del Babuino, Rome', check_in_date: '2025-10-01', check_out_date: '2025-10-08', price_per_night: 380, total_price: 2660, booking_status: 'confirmed', rating: 4.7 },
      { name: 'Burj Al Arab', type: 'Luxury Hotel', address: 'Jumeirah Beach Road, Dubai', check_in_date: '2025-11-15', check_out_date: '2025-11-22', price_per_night: 1200, total_price: 8400, booking_status: 'pending', rating: 4.9 },
      { name: 'The Omnia', type: 'Boutique Hotel', address: 'Auf dem Fels, Zermatt', check_in_date: '2025-02-10', check_out_date: '2025-02-17', price_per_night: 600, total_price: 4200, booking_status: 'confirmed', rating: 4.8 },
      { name: 'Canaves Oia Santorini', type: 'Resort', address: 'Oia, Santorini', check_in_date: '2025-07-01', check_out_date: '2025-07-10', price_per_night: 480, total_price: 4320, booking_status: 'confirmed', rating: 4.9 },
      { name: 'Mandarin Oriental Bangkok', type: 'Luxury Hotel', address: '48 Oriental Avenue, Bangkok', check_in_date: '2025-03-15', check_out_date: '2025-03-28', price_per_night: 250, total_price: 3250, booking_status: 'confirmed', rating: 4.8 },
      { name: 'Ion Adventure Hotel', type: 'Design Hotel', address: 'Nesjavellir, Iceland', check_in_date: '2025-01-20', check_out_date: '2025-01-27', price_per_night: 350, total_price: 2450, booking_status: 'confirmed', rating: 4.6 },
      { name: 'La Mamounia', type: 'Palace Hotel', address: 'Avenue Bab Jdid, Marrakech', check_in_date: '2025-04-20', check_out_date: '2025-04-28', price_per_night: 400, total_price: 3200, booking_status: 'pending', rating: 4.7 },
      { name: 'Nayara Springs', type: 'Resort', address: 'La Fortuna, Costa Rica', check_in_date: '2025-06-15', check_out_date: '2025-06-25', price_per_night: 700, total_price: 7000, booking_status: 'pending', rating: 4.9 }
    ];

    for (const acc of accommodations) {
      await pool.query(
        `INSERT INTO accommodations (user_id, name, type, address, check_in_date, check_out_date, price_per_night, total_price, booking_status, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, acc.name, acc.type, acc.address, acc.check_in_date, acc.check_out_date, acc.price_per_night, acc.total_price, acc.booking_status, acc.rating]
      );
    }
    console.log('Accommodations seeded');

    // Seed Transportation (15 items)
    const transportation = [
      { type: 'Flight', provider: 'Air France', departure_location: 'JFK New York', arrival_location: 'CDG Paris', departure_date: '2025-06-01', departure_time: '18:00', arrival_date: '2025-06-02', arrival_time: '07:30', cost: 850, status: 'confirmed', seat_info: '14A' },
      { type: 'Flight', provider: 'Japan Airlines', departure_location: 'LAX Los Angeles', arrival_location: 'NRT Tokyo', departure_date: '2025-04-01', departure_time: '11:00', arrival_date: '2025-04-02', arrival_time: '15:00', cost: 1200, status: 'confirmed', seat_info: '22K' },
      { type: 'Train', provider: 'Amtrak', departure_location: 'Washington DC', arrival_location: 'New York Penn', departure_date: '2025-07-15', departure_time: '08:00', arrival_date: '2025-07-15', arrival_time: '11:30', cost: 150, status: 'booked', seat_info: 'Coach 5' },
      { type: 'Flight', provider: 'Emirates', departure_location: 'SIN Singapore', arrival_location: 'DPS Bali', departure_date: '2025-08-10', departure_time: '09:00', arrival_date: '2025-08-10', arrival_time: '12:00', cost: 280, status: 'confirmed', seat_info: '8F' },
      { type: 'Flight', provider: 'British Airways', departure_location: 'JFK New York', arrival_location: 'LHR London', departure_date: '2025-09-05', departure_time: '22:00', arrival_date: '2025-09-06', arrival_time: '10:00', cost: 750, status: 'confirmed', seat_info: '18A' },
      { type: 'Train', provider: 'Eurostar', departure_location: 'London St Pancras', arrival_location: 'Paris Gare du Nord', departure_date: '2025-05-20', departure_time: '07:01', arrival_date: '2025-05-20', arrival_time: '10:17', cost: 180, status: 'booked', seat_info: 'Standard Premier' },
      { type: 'Flight', provider: 'Qantas', departure_location: 'LAX Los Angeles', arrival_location: 'SYD Sydney', departure_date: '2025-12-20', departure_time: '21:00', arrival_date: '2025-12-22', arrival_time: '07:30', cost: 1800, status: 'confirmed', seat_info: '32J' },
      { type: 'Train', provider: 'Trenitalia', departure_location: 'Rome Termini', arrival_location: 'Florence SMN', departure_date: '2025-10-03', departure_time: '10:00', arrival_date: '2025-10-03', arrival_time: '11:30', cost: 45, status: 'booked', seat_info: 'Frecciarossa' },
      { type: 'Flight', provider: 'Emirates', departure_location: 'LHR London', arrival_location: 'DXB Dubai', departure_date: '2025-11-15', departure_time: '14:00', arrival_date: '2025-11-16', arrival_time: '00:30', cost: 600, status: 'confirmed', seat_info: '5A' },
      { type: 'Train', provider: 'Swiss Railways', departure_location: 'Zurich HB', arrival_location: 'Zermatt', departure_date: '2025-02-10', departure_time: '08:00', arrival_date: '2025-02-10', arrival_time: '11:30', cost: 120, status: 'booked', seat_info: 'First Class' },
      { type: 'Ferry', provider: 'Blue Star Ferries', departure_location: 'Athens Piraeus', arrival_location: 'Santorini', departure_date: '2025-07-01', departure_time: '07:30', arrival_date: '2025-07-01', arrival_time: '15:00', cost: 60, status: 'booked', seat_info: 'Deck Seat' },
      { type: 'Flight', provider: 'Thai Airways', departure_location: 'SFO San Francisco', arrival_location: 'BKK Bangkok', departure_date: '2025-03-15', departure_time: '23:00', arrival_date: '2025-03-17', arrival_time: '06:00', cost: 950, status: 'confirmed', seat_info: '28C' },
      { type: 'Flight', provider: 'Icelandair', departure_location: 'BOS Boston', arrival_location: 'KEF Reykjavik', departure_date: '2025-01-20', departure_time: '19:00', arrival_date: '2025-01-21', arrival_time: '06:00', cost: 500, status: 'confirmed', seat_info: '12D' },
      { type: 'Flight', provider: 'Royal Air Maroc', departure_location: 'CDG Paris', arrival_location: 'RAK Marrakech', departure_date: '2025-04-20', departure_time: '10:00', arrival_date: '2025-04-20', arrival_time: '12:30', cost: 180, status: 'booked', seat_info: '7B' },
      { type: 'Flight', provider: 'United Airlines', departure_location: 'ORD Chicago', arrival_location: 'SJO San Jose', departure_date: '2025-06-15', departure_time: '08:00', arrival_date: '2025-06-15', arrival_time: '14:00', cost: 450, status: 'confirmed', seat_info: '19F' }
    ];

    for (const trans of transportation) {
      await pool.query(
        `INSERT INTO transportation (user_id, type, provider, departure_location, arrival_location, departure_date, departure_time, arrival_date, arrival_time, cost, status, seat_info)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [userId, trans.type, trans.provider, trans.departure_location, trans.arrival_location, trans.departure_date, trans.departure_time, trans.arrival_date, trans.arrival_time, trans.cost, trans.status, trans.seat_info]
      );
    }
    console.log('Transportation seeded');

    // Seed Restaurants (15 items)
    const restaurants = [
      { name: 'Le Comptoir du Panthéon', cuisine: 'French', address: '10 Rue Soufflot, 75005 Paris', price_range: '$$$', rating: 4.5, phone: '+33 1 43 54 75 56', must_try_dishes: ['Duck Confit', 'Crème Brûlée'] },
      { name: 'Sukiyabashi Jiro', cuisine: 'Japanese Sushi', address: 'Tsukamoto Sogyo Building, Tokyo', price_range: '$$$$', rating: 4.9, phone: '+81 3 3535 3600', must_try_dishes: ['Omakase', 'Kohada'] },
      { name: 'Eleven Madison Park', cuisine: 'American Fine Dining', address: '11 Madison Ave, New York', price_range: '$$$$', rating: 4.8, phone: '+1 212 889 0905', must_try_dishes: ['Tasting Menu', 'Honey Lavender Duck'] },
      { name: 'Locavore', cuisine: 'Indonesian Fusion', address: 'Jl Dewi Sita, Ubud, Bali', price_range: '$$$', rating: 4.7, phone: '+62 361 977733', must_try_dishes: ['Degustation Menu', 'Local Vegetables'] },
      { name: 'Dishoom', cuisine: 'Indian', address: '12 Upper St Martin Lane, London', price_range: '$$', rating: 4.6, phone: '+44 20 7420 9320', must_try_dishes: ['Bacon Naan Roll', 'Black Daal'] },
      { name: 'Tickets', cuisine: 'Spanish Tapas', address: 'Av. del Paral·lel, Barcelona', price_range: '$$$', rating: 4.7, phone: '+34 932 92 42 53', must_try_dishes: ['Air Baguette', 'Spherical Olives'] },
      { name: 'Quay', cuisine: 'Australian Modern', address: 'Upper Level, Overseas Passenger Terminal, Sydney', price_range: '$$$$', rating: 4.8, phone: '+61 2 9251 5600', must_try_dishes: ['Snow Egg', 'Mud Crab'] },
      { name: 'Roscioli', cuisine: 'Italian', address: 'Via dei Giubbonari, Rome', price_range: '$$', rating: 4.6, phone: '+39 06 687 5287', must_try_dishes: ['Carbonara', 'Cacio e Pepe'] },
      { name: 'Zuma Dubai', cuisine: 'Japanese Contemporary', address: 'Gate Village, DIFC, Dubai', price_range: '$$$$', rating: 4.7, phone: '+971 4 425 5660', must_try_dishes: ['Black Cod', 'Robata Platter'] },
      { name: 'Chez Vrony', cuisine: 'Swiss Alpine', address: 'Findeln, Zermatt', price_range: '$$$', rating: 4.5, phone: '+41 27 967 25 52', must_try_dishes: ['Cheese Fondue', 'Lamb Cutlets'] },
      { name: 'Selene', cuisine: 'Greek Gourmet', address: 'Fira, Santorini', price_range: '$$$', rating: 4.6, phone: '+30 22860 22249', must_try_dishes: ['Fava', 'Slow-cooked Lamb'] },
      { name: 'Gaggan', cuisine: 'Progressive Indian', address: '68/1 Soi Langsuan, Bangkok', price_range: '$$$$', rating: 4.9, phone: '+66 2 652 1700', must_try_dishes: ['Emoji Menu', 'Lick It Up'] },
      { name: 'Grillið', cuisine: 'Nordic', address: 'Hagatorg, Reykjavik', price_range: '$$$$', rating: 4.5, phone: '+354 525 9960', must_try_dishes: ['Arctic Char', 'Lamb Fillet'] },
      { name: 'Le Jardin', cuisine: 'Moroccan', address: '32 Souk Jeld, Marrakech', price_range: '$$', rating: 4.4, phone: '+212 524 378295', must_try_dishes: ['Tagine', 'Couscous'] },
      { name: 'Siku', cuisine: 'Costa Rican', address: 'Hotel Nayara, La Fortuna', price_range: '$$$', rating: 4.6, phone: '+506 2479 1600', must_try_dishes: ['Ceviche', 'Gallo Pinto'] }
    ];

    for (const rest of restaurants) {
      await pool.query(
        `INSERT INTO restaurants (user_id, name, cuisine, address, price_range, rating, phone, must_try_dishes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, rest.name, rest.cuisine, rest.address, rest.price_range, rest.rating, rest.phone, rest.must_try_dishes]
      );
    }
    console.log('Restaurants seeded');

    // Seed Budgets (15 items)
    const budgets = [
      { category: 'Flights', planned_amount: 850, actual_amount: 850, currency: 'USD', notes: 'Round trip to Paris' },
      { category: 'Accommodation', planned_amount: 1620, actual_amount: 1620, currency: 'USD', notes: 'Hotel Le Marais 9 nights' },
      { category: 'Food & Dining', planned_amount: 500, actual_amount: 380, currency: 'USD', notes: 'Restaurants and cafes' },
      { category: 'Activities', planned_amount: 300, actual_amount: 200, currency: 'USD', notes: 'Museum tickets and tours' },
      { category: 'Transportation', planned_amount: 150, actual_amount: 100, currency: 'USD', notes: 'Metro and taxis' },
      { category: 'Shopping', planned_amount: 400, actual_amount: 250, currency: 'USD', notes: 'Souvenirs and gifts' },
      { category: 'Emergency Fund', planned_amount: 200, actual_amount: 0, currency: 'USD', notes: 'Just in case' },
      { category: 'Travel Insurance', planned_amount: 80, actual_amount: 75, currency: 'USD', notes: 'Comprehensive coverage' },
      { category: 'Visa Fees', planned_amount: 0, actual_amount: 0, currency: 'USD', notes: 'Not required for US citizens' },
      { category: 'Entertainment', planned_amount: 200, actual_amount: 150, currency: 'USD', notes: 'Shows and nightlife' },
      { category: 'Tips & Gratuities', planned_amount: 100, actual_amount: 80, currency: 'USD', notes: 'Service tips' },
      { category: 'Phone & Data', planned_amount: 50, actual_amount: 45, currency: 'USD', notes: 'International roaming' },
      { category: 'Laundry', planned_amount: 30, actual_amount: 20, currency: 'USD', notes: 'Hotel laundry service' },
      { category: 'Snacks & Drinks', planned_amount: 75, actual_amount: 60, currency: 'USD', notes: 'Convenience store purchases' },
      { category: 'Miscellaneous', planned_amount: 100, actual_amount: 50, currency: 'USD', notes: 'Unexpected expenses' }
    ];

    for (const budget of budgets) {
      await pool.query(
        `INSERT INTO budgets (user_id, category, planned_amount, actual_amount, currency, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, budget.category, budget.planned_amount, budget.actual_amount, budget.currency, budget.notes]
      );
    }
    console.log('Budgets seeded');

    // Seed Documents (15 items)
    const documents = [
      { type: 'Passport', name: 'US Passport', document_number: 'P12345678', issue_date: '2020-05-15', expiry_date: '2030-05-14', issuing_country: 'United States' },
      { type: 'Visa', name: 'Japan Tourist Visa', document_number: 'JV987654', issue_date: '2025-02-01', expiry_date: '2025-08-01', issuing_country: 'Japan' },
      { type: 'Travel Insurance', name: 'World Nomads Policy', document_number: 'WN2025001234', issue_date: '2025-01-01', expiry_date: '2025-12-31', issuing_country: 'Australia' },
      { type: 'Driver License', name: 'International Driving Permit', document_number: 'IDP456789', issue_date: '2024-06-01', expiry_date: '2025-06-01', issuing_country: 'United States' },
      { type: 'Vaccination Card', name: 'COVID-19 Vaccination', document_number: 'VAX123456', issue_date: '2023-01-15', expiry_date: '2026-01-15', issuing_country: 'United States' },
      { type: 'Health Insurance', name: 'Blue Cross International', document_number: 'BC789012', issue_date: '2025-01-01', expiry_date: '2025-12-31', issuing_country: 'United States' },
      { type: 'Credit Card', name: 'Chase Sapphire Reserve', document_number: '****4567', issue_date: '2023-03-01', expiry_date: '2026-03-01', issuing_country: 'United States' },
      { type: 'Membership', name: 'Global Entry', document_number: 'GE98765432', issue_date: '2023-07-01', expiry_date: '2028-07-01', issuing_country: 'United States' },
      { type: 'Membership', name: 'TSA PreCheck', document_number: 'TSA123456', issue_date: '2023-07-01', expiry_date: '2028-07-01', issuing_country: 'United States' },
      { type: 'Hotel Loyalty', name: 'Marriott Bonvoy Gold', document_number: 'MB456789012', issue_date: '2024-01-01', expiry_date: '2025-12-31', issuing_country: 'United States' },
      { type: 'Airline Loyalty', name: 'Delta SkyMiles Platinum', document_number: 'DL789012345', issue_date: '2024-02-01', expiry_date: '2026-01-31', issuing_country: 'United States' },
      { type: 'Emergency Contact Card', name: 'ICE Card', document_number: 'ICE001', issue_date: '2025-01-01', expiry_date: '2026-01-01', issuing_country: 'United States' },
      { type: 'Visa', name: 'Schengen Visa', document_number: 'SCH123456', issue_date: '2025-04-01', expiry_date: '2025-10-01', issuing_country: 'France' },
      { type: 'Membership', name: 'Priority Pass', document_number: 'PP789456123', issue_date: '2024-06-01', expiry_date: '2025-06-01', issuing_country: 'United Kingdom' },
      { type: 'Travel Card', name: 'Oyster Card', document_number: 'OY123456789', issue_date: '2025-01-01', expiry_date: '2030-01-01', issuing_country: 'United Kingdom' }
    ];

    for (const doc of documents) {
      await pool.query(
        `INSERT INTO documents (user_id, type, name, document_number, issue_date, expiry_date, issuing_country)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, doc.type, doc.name, doc.document_number, doc.issue_date, doc.expiry_date, doc.issuing_country]
      );
    }
    console.log('Documents seeded');

    // Seed Packing Lists (15 items)
    const packingItems = [
      { item_name: 'Passport', category: 'Documents', quantity: 1, is_packed: true, priority: 'high' },
      { item_name: 'Phone Charger', category: 'Electronics', quantity: 1, is_packed: true, priority: 'high' },
      { item_name: 'Universal Power Adapter', category: 'Electronics', quantity: 1, is_packed: true, priority: 'high' },
      { item_name: 'T-Shirts', category: 'Clothing', quantity: 5, is_packed: false, priority: 'medium' },
      { item_name: 'Jeans', category: 'Clothing', quantity: 2, is_packed: false, priority: 'medium' },
      { item_name: 'Comfortable Walking Shoes', category: 'Footwear', quantity: 1, is_packed: false, priority: 'high' },
      { item_name: 'Toothbrush & Toothpaste', category: 'Toiletries', quantity: 1, is_packed: false, priority: 'high' },
      { item_name: 'Sunscreen SPF 50', category: 'Toiletries', quantity: 1, is_packed: false, priority: 'medium' },
      { item_name: 'Camera', category: 'Electronics', quantity: 1, is_packed: false, priority: 'medium' },
      { item_name: 'Travel Pillow', category: 'Comfort', quantity: 1, is_packed: false, priority: 'low' },
      { item_name: 'Medications', category: 'Health', quantity: 1, is_packed: true, priority: 'high' },
      { item_name: 'Rain Jacket', category: 'Clothing', quantity: 1, is_packed: false, priority: 'medium' },
      { item_name: 'Swimsuit', category: 'Clothing', quantity: 2, is_packed: false, priority: 'medium' },
      { item_name: 'Sunglasses', category: 'Accessories', quantity: 1, is_packed: false, priority: 'medium' },
      { item_name: 'Reusable Water Bottle', category: 'Essentials', quantity: 1, is_packed: false, priority: 'medium' }
    ];

    for (const item of packingItems) {
      await pool.query(
        `INSERT INTO packing_lists (user_id, item_name, category, quantity, is_packed, priority)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, item.item_name, item.category, item.quantity, item.is_packed, item.priority]
      );
    }
    console.log('Packing Lists seeded');

    // Seed Travel Tips (15 items)
    const tips = [
      { destination: 'Paris', category: 'Money', title: 'Cash vs Card in Paris', content: 'Most places accept credit cards, but keep some euros for small purchases and markets. Notify your bank before traveling.' },
      { destination: 'Tokyo', category: 'Culture', title: 'Bowing Etiquette', content: 'A slight bow is appreciated when greeting. The deeper the bow, the more respect shown. A 15-degree bow is appropriate for casual encounters.' },
      { destination: 'Bali', category: 'Safety', title: 'Monkeys at Temples', content: 'At temples like Uluwatu, monkeys may grab belongings. Secure glasses, phones, and jewelry before entering.' },
      { destination: 'London', category: 'Transportation', title: 'Oyster Card Tips', content: 'Get an Oyster card or use contactless payment for cheaper tube fares. Daily caps prevent overspending.' },
      { destination: 'Barcelona', category: 'Safety', title: 'Pickpocket Awareness', content: 'Las Ramblas and crowded metros are hotspots. Keep valuables in front pockets and use money belts.' },
      { destination: 'Rome', category: 'Food', title: 'Authentic Dining', content: 'Avoid restaurants with picture menus near tourist sites. Walk a few blocks into residential areas for authentic trattorias.' },
      { destination: 'Dubai', category: 'Dress Code', title: 'Modest Dressing', content: 'Cover shoulders and knees when visiting malls, mosques, and public areas. Beachwear is only appropriate at beaches and pools.' },
      { destination: 'Japan', category: 'Transportation', title: 'JR Pass Value', content: 'If visiting multiple cities, a JR Pass can save significant money on bullet trains. Must be purchased before arriving in Japan.' },
      { destination: 'Thailand', category: 'Health', title: 'Street Food Safety', content: 'Choose busy stalls with high turnover. Watch that meat is cooked fresh and avoid ice in drinks at questionable vendors.' },
      { destination: 'Iceland', category: 'Nature', title: 'Hot Spring Safety', content: 'Always test water temperature before entering natural hot springs. Some can be dangerously hot without warning signs.' },
      { destination: 'Morocco', category: 'Bargaining', title: 'Souk Shopping', content: 'Bargaining is expected in souks. Start at 30% of asking price and settle around 50-60%. Walk away as a negotiation tactic.' },
      { destination: 'Greece', category: 'Timing', title: 'Siesta Hours', content: 'Many shops close 2-5pm for siesta. Plan shopping and activities around these hours. Restaurants often don\'t open until 8pm.' },
      { destination: 'Switzerland', category: 'Money', title: 'Budget Tips', content: 'Eat at Coop or Migros cafeterias for affordable meals. Get the Swiss Travel Pass for unlimited transport and museum discounts.' },
      { destination: 'Costa Rica', category: 'Wildlife', title: 'Animal Encounters', content: 'Never touch or feed wildlife. Keep safe distances from all animals. Use licensed guides for wildlife tours.' },
      { destination: 'General', category: 'Photography', title: 'Sunrise Advantage', content: 'Popular attractions are least crowded at opening time. Arrive early for the best photos without crowds.' }
    ];

    for (const tip of tips) {
      await pool.query(
        `INSERT INTO travel_tips (user_id, destination, category, title, content, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, tip.destination, tip.category, tip.title, tip.content, true]
      );
    }
    console.log('Travel Tips seeded');

    // Seed Emergency Contacts (15 items)
    const emergencyContacts = [
      { name: 'John Smith', relationship: 'Spouse', phone: '+1-555-0101', email: 'john.smith@email.com', is_primary: true },
      { name: 'Mary Johnson', relationship: 'Mother', phone: '+1-555-0102', email: 'mary.johnson@email.com', is_primary: false },
      { name: 'US Embassy Paris', relationship: 'Embassy', phone: '+33-1-43-12-22-22', email: 'parisACS@state.gov', is_primary: false },
      { name: 'US Embassy Tokyo', relationship: 'Embassy', phone: '+81-3-3224-5000', email: 'tokyoACS@state.gov', is_primary: false },
      { name: 'Dr. Sarah Williams', relationship: 'Primary Doctor', phone: '+1-555-0103', email: 'dr.williams@medical.com', is_primary: false },
      { name: 'Travel Insurance Hotline', relationship: 'Insurance', phone: '+1-800-555-0104', email: 'claims@worldnomads.com', is_primary: false },
      { name: 'Chase Lost Card', relationship: 'Bank', phone: '+1-800-935-9935', email: 'support@chase.com', is_primary: false },
      { name: 'Robert Smith', relationship: 'Brother', phone: '+1-555-0105', email: 'robert.smith@email.com', is_primary: false },
      { name: 'Jennifer Davis', relationship: 'Best Friend', phone: '+1-555-0106', email: 'jen.davis@email.com', is_primary: false },
      { name: 'Work HR Department', relationship: 'Employer', phone: '+1-555-0107', email: 'hr@company.com', is_primary: false },
      { name: 'Pet Sitter', relationship: 'Service', phone: '+1-555-0108', email: 'pawsitter@email.com', is_primary: false },
      { name: 'House Sitter', relationship: 'Service', phone: '+1-555-0109', email: 'housesitter@email.com', is_primary: false },
      { name: 'Lawyer', relationship: 'Legal', phone: '+1-555-0110', email: 'lawyer@lawfirm.com', is_primary: false },
      { name: 'Accountant', relationship: 'Financial', phone: '+1-555-0111', email: 'cpa@accounting.com', is_primary: false },
      { name: 'Local Police (General)', relationship: 'Emergency', phone: '911', email: '', is_primary: false }
    ];

    for (const contact of emergencyContacts) {
      await pool.query(
        `INSERT INTO emergency_contacts (user_id, name, relationship, phone, email, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, contact.name, contact.relationship, contact.phone, contact.email, contact.is_primary]
      );
    }
    console.log('Emergency Contacts seeded');

    // Seed Reviews (15 items)
    const reviews = [
      { entity_type: 'Hotel', entity_name: 'Hotel Le Marais', rating: 5, title: 'Perfect Parisian Stay', content: 'Excellent location in Le Marais, beautiful rooms, amazing breakfast. Staff was incredibly helpful.', pros: ['Location', 'Breakfast', 'Service'], cons: ['Small elevator'], would_recommend: true, visit_date: '2024-06-10' },
      { entity_type: 'Restaurant', entity_name: 'Le Comptoir du Panthéon', rating: 4, title: 'Authentic French Cuisine', content: 'Classic French dishes done well. Duck confit was excellent. Busy atmosphere.', pros: ['Food quality', 'Atmosphere'], cons: ['Wait time', 'Noise level'], would_recommend: true, visit_date: '2024-06-05' },
      { entity_type: 'Activity', entity_name: 'Eiffel Tower Night Visit', rating: 5, title: 'Magical Experience', content: 'Going at night was the best decision. Less crowded and the city lights are stunning.', pros: ['Views', 'Less crowded', 'Photos'], cons: ['Cold at top'], would_recommend: true, visit_date: '2024-06-03' },
      { entity_type: 'Hotel', entity_name: 'Park Hyatt Tokyo', rating: 5, title: 'Luxury at Its Finest', content: 'Impeccable service, stunning views, incredible attention to detail. Worth every penny.', pros: ['Service', 'Views', 'Location'], cons: ['Price'], would_recommend: true, visit_date: '2024-04-14' },
      { entity_type: 'Restaurant', entity_name: 'Sukiyabashi Jiro', rating: 5, title: 'Once in a Lifetime', content: 'The best sushi I have ever had. Each piece was a masterpiece. Reservation was difficult but worth it.', pros: ['Quality', 'Experience', 'Freshness'], cons: ['Price', 'Hard to book'], would_recommend: true, visit_date: '2024-04-08' },
      { entity_type: 'Transportation', entity_name: 'Japan Rail Pass', rating: 5, title: 'Essential for Japan Travel', content: 'Made traveling between cities so easy. The bullet train is incredibly efficient and comfortable.', pros: ['Value', 'Convenience', 'Speed'], cons: ['Must purchase before arrival'], would_recommend: true, visit_date: '2024-04-01' },
      { entity_type: 'Activity', entity_name: 'Broadway - The Lion King', rating: 5, title: 'Spectacular Show', content: 'The costumes, music, and performances were incredible. A must-see in New York.', pros: ['Costumes', 'Music', 'Acting'], cons: ['Ticket price'], would_recommend: true, visit_date: '2024-07-18' },
      { entity_type: 'Hotel', entity_name: 'Four Seasons Bali', rating: 4, title: 'Paradise with Minor Issues', content: 'Beautiful resort, amazing pool, great spa. WiFi was inconsistent in some areas.', pros: ['Pool', 'Spa', 'Beach'], cons: ['WiFi', 'Distance to town'], would_recommend: true, visit_date: '2024-08-20' },
      { entity_type: 'Restaurant', entity_name: 'Dishoom', rating: 4, title: 'Best Indian in London', content: 'The bacon naan roll is legendary. Arrive early to avoid long queues.', pros: ['Food', 'Ambiance', 'Value'], cons: ['Wait times', 'Crowded'], would_recommend: true, visit_date: '2024-09-07' },
      { entity_type: 'Activity', entity_name: 'Tower of London', rating: 4, title: 'History Comes Alive', content: 'Fascinating history, Crown Jewels are impressive. Can get very crowded.', pros: ['History', 'Crown Jewels', 'Beefeaters'], cons: ['Crowds', 'Walking'], would_recommend: true, visit_date: '2024-09-06' },
      { entity_type: 'Hotel', entity_name: 'The Omnia', rating: 5, title: 'Alpine Luxury', content: 'Stunning Matterhorn views, ski-in location, world-class spa. Pure perfection.', pros: ['Views', 'Location', 'Spa'], cons: ['Very expensive'], would_recommend: true, visit_date: '2024-02-17' },
      { entity_type: 'Transportation', entity_name: 'Glacier Express', rating: 5, title: 'Most Scenic Train Ride', content: 'Eight hours of stunning Swiss Alps scenery. The panoramic windows are perfect.', pros: ['Scenery', 'Comfort', 'Dining car'], cons: ['Length', 'Price'], would_recommend: true, visit_date: '2024-02-15' },
      { entity_type: 'Restaurant', entity_name: 'Selene', rating: 4, title: 'Greek Fine Dining', content: 'Creative take on traditional Greek cuisine. Sunset views over the caldera.', pros: ['Views', 'Creativity', 'Service'], cons: ['Portions small'], would_recommend: true, visit_date: '2024-07-05' },
      { entity_type: 'Activity', entity_name: 'Northern Lights Tour', rating: 5, title: 'Bucket List Experience', content: 'Finally saw the aurora borealis! Guide was knowledgeable and found a perfect viewing spot.', pros: ['Experience', 'Guide', 'Photos'], cons: ['Cold', 'No guarantee'], would_recommend: true, visit_date: '2024-01-25' },
      { entity_type: 'Hotel', entity_name: 'Ion Adventure Hotel', rating: 4, title: 'Unique Design Hotel', content: 'Incredible architecture, great Northern Lights viewing area. Remote but stunning.', pros: ['Design', 'Aurora viewing', 'Hot tub'], cons: ['Remote location', 'Restaurant limited'], would_recommend: true, visit_date: '2024-01-27' }
    ];

    for (const review of reviews) {
      await pool.query(
        `INSERT INTO reviews (user_id, entity_type, entity_name, rating, title, content, pros, cons, would_recommend, visit_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, review.entity_type, review.entity_name, review.rating, review.title, review.content, review.pros, review.cons, review.would_recommend, review.visit_date]
      );
    }
    console.log('Reviews seeded');

    // Seed Photos (15 items)
    const photos = [
      { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', title: 'Eiffel Tower at Sunset', description: 'Golden hour at the Eiffel Tower', location: 'Paris, France', is_favorite: true, tags: ['Paris', 'Eiffel Tower', 'Sunset'] },
      { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', title: 'Tokyo Skyline', description: 'View from Tokyo Skytree', location: 'Tokyo, Japan', is_favorite: true, tags: ['Tokyo', 'Skyline', 'Night'] },
      { url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9', title: 'Times Square', description: 'The heart of New York City', location: 'New York, USA', is_favorite: false, tags: ['NYC', 'Times Square', 'Lights'] },
      { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', title: 'Bali Rice Terraces', description: 'Tegallalang Rice Terraces', location: 'Ubud, Bali', is_favorite: true, tags: ['Bali', 'Rice Terraces', 'Nature'] },
      { url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad', title: 'London Bridge', description: 'Iconic London landmark', location: 'London, UK', is_favorite: false, tags: ['London', 'Bridge', 'Architecture'] },
      { url: 'https://images.unsplash.com/photo-1583422409516-2895a77efced', title: 'Sagrada Familia', description: 'Gaudi\'s masterpiece', location: 'Barcelona, Spain', is_favorite: true, tags: ['Barcelona', 'Gaudi', 'Architecture'] },
      { url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9', title: 'Sydney Opera House', description: 'Harbor view at dusk', location: 'Sydney, Australia', is_favorite: true, tags: ['Sydney', 'Opera House', 'Harbor'] },
      { url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5', title: 'Roman Colosseum', description: 'Ancient amphitheater', location: 'Rome, Italy', is_favorite: true, tags: ['Rome', 'Colosseum', 'History'] },
      { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', title: 'Burj Khalifa', description: 'World\'s tallest building', location: 'Dubai, UAE', is_favorite: false, tags: ['Dubai', 'Burj Khalifa', 'Architecture'] },
      { url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7', title: 'Matterhorn', description: 'Alpine peak at sunrise', location: 'Zermatt, Switzerland', is_favorite: true, tags: ['Switzerland', 'Matterhorn', 'Mountains'] },
      { url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e', title: 'Santorini Sunset', description: 'Famous blue domes', location: 'Santorini, Greece', is_favorite: true, tags: ['Santorini', 'Greece', 'Sunset'] },
      { url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365', title: 'Bangkok Temple', description: 'Wat Arun at dawn', location: 'Bangkok, Thailand', is_favorite: false, tags: ['Bangkok', 'Temple', 'Culture'] },
      { url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67', title: 'Northern Lights', description: 'Aurora Borealis over Iceland', location: 'Reykjavik, Iceland', is_favorite: true, tags: ['Iceland', 'Aurora', 'Night'] },
      { url: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43', title: 'Marrakech Medina', description: 'Colorful market streets', location: 'Marrakech, Morocco', is_favorite: false, tags: ['Morocco', 'Medina', 'Market'] },
      { url: 'https://images.unsplash.com/photo-1518259102261-b40117eabbc9', title: 'Costa Rica Rainforest', description: 'Lush tropical forest', location: 'Costa Rica', is_favorite: true, tags: ['Costa Rica', 'Rainforest', 'Nature'] }
    ];

    for (const photo of photos) {
      await pool.query(
        `INSERT INTO photos (user_id, url, title, description, location, is_favorite, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, photo.url, photo.title, photo.description, photo.location, photo.is_favorite, photo.tags]
      );
    }
    console.log('Photos seeded');

    // Seed Notes (15 items)
    const notes = [
      { title: 'Paris Metro Tips', content: 'Buy a carnet of 10 tickets for savings. Line 1 is driverless and fun to ride. Avoid rush hours 8-9am and 5-7pm.', category: 'Transportation', is_pinned: true, color: '#e3f2fd' },
      { title: 'Japanese Phrases', content: 'Arigatou (Thank you), Sumimasen (Excuse me), Oishi (Delicious), Ikura desu ka (How much?)', category: 'Language', is_pinned: true, color: '#fff3e0' },
      { title: 'NYC Restaurant List', content: '1. Katz Deli - Pastrami\n2. Joe Pizza - Slice\n3. Russ & Daughters - Bagel\n4. Peter Luger - Steak', category: 'Food', is_pinned: false, color: '#f3e5f5' },
      { title: 'Bali Scooter Rental', content: 'International driving permit needed. Helmet always. Gas stations not everywhere - fill up in towns. Watch for offerings on road.', category: 'Transportation', is_pinned: false, color: '#e8f5e9' },
      { title: 'London Free Museums', content: 'British Museum, Natural History Museum, V&A, Tate Modern, National Gallery - all free entry!', category: 'Activities', is_pinned: true, color: '#fce4ec' },
      { title: 'Barcelona Markets', content: 'La Boqueria - tourist but fun. Santa Caterina - more local. Sant Antoni - Sunday book market.', category: 'Shopping', is_pinned: false, color: '#fff8e1' },
      { title: 'Sydney Beach Safety', content: 'Always swim between the flags. Stinger season Nov-May in north. Watch for rips. Slip slop slap - sunscreen essential.', category: 'Safety', is_pinned: true, color: '#e1f5fe' },
      { title: 'Rome Day Pass', content: 'Roma Pass 48hr or 72hr includes metro and museum entries. Book Colosseum separately for best times.', category: 'Transportation', is_pinned: false, color: '#f1f8e9' },
      { title: 'Dubai Mall Tips', content: 'Free shuttle from metro. Aquarium is worth it. Fountain show every 30 min after 6pm. Ice rink for cooling down.', category: 'Activities', is_pinned: false, color: '#fafafa' },
      { title: 'Swiss Mountain Safety', content: 'Check weather before hiking. Tell someone your route. Bring layers - weather changes fast. Helicopter rescue insurance recommended.', category: 'Safety', is_pinned: true, color: '#ffebee' },
      { title: 'Santorini Sunset Spots', content: 'Oia is crowded but iconic. Try Akrotiri lighthouse for fewer people. Book rooftop dinner early for best seats.', category: 'Activities', is_pinned: false, color: '#e8eaf6' },
      { title: 'Thai Massage Tips', content: 'Wat Pho is the traditional school. Ask for medium pressure first. Tip 50-100 baht. Avoid Khao San tourist traps.', category: 'Wellness', is_pinned: false, color: '#e0f2f1' },
      { title: 'Iceland Ring Road', content: 'Allow 7-10 days minimum. F-roads need 4x4. Book campsites in summer. Gas stations accept cards. Download offline maps.', category: 'Transportation', is_pinned: true, color: '#eceff1' },
      { title: 'Marrakech Bargaining', content: 'Start at 1/3 of asking price. Be prepared to walk away. Fixed prices at Ensemble Artisanal for comparison.', category: 'Shopping', is_pinned: false, color: '#fff3e0' },
      { title: 'Costa Rica Wildlife', content: 'Best spots: Manuel Antonio, Tortuguero, Corcovado. Dawn and dusk for wildlife. Bring binoculars. Hire a guide.', category: 'Nature', is_pinned: false, color: '#e8f5e9' }
    ];

    for (const note of notes) {
      await pool.query(
        `INSERT INTO notes (user_id, title, content, category, is_pinned, color)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, note.title, note.content, note.category, note.is_pinned, note.color]
      );
    }
    console.log('Notes seeded');

    console.log('All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

async function main() {
  const resetMode = process.argv.includes('--reset');

  try {
    await createDatabase();

    if (resetMode) {
      console.log('Reset mode: Dropping all tables...');
      await dropTables();
    }

    await createTables();
    await seedData();
    console.log('Database setup and seeding completed successfully!');
  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    await pool.end();
  }
}

main();

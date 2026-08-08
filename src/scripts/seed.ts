import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Coupon } from '../models/Coupon';
import { Society } from '../models/Society';
import { Product } from '../models/Product';

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing categories, coupons, societies, and products...');
    await Category.deleteMany({});
    await Coupon.deleteMany({});
    await Society.deleteMany({});
    await Product.deleteMany({});

    // Keep active admin users safe; seed default admin only if user list is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default admin user...');
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      await User.create({
        email: 'admin@rakhistore.com',
        passwordHash: hashedPassword,
      });
      console.log('Default admin seeded.');
    } else {
      console.log('Active admin users found. Skipping default admin seed to preserve them.');
    }
    console.log('Admin user seeded (admin@rakhistore.com / adminpassword123)');

    console.log('Seeding categories...');
    const categories = [
      { name: 'Traditional Rakhis', description: 'Classic sacred threads' },
      { name: 'Designer Rakhis', description: 'Modern and stylish designs' },
      { name: 'Kids Rakhis', description: 'Cute cartoon and toy themes' },
      { name: 'Bhaiya-Bhabhi Combos', description: 'Matching sets for Bhaiya and Bhabhi' },
      { name: 'Premium Rakhis', description: 'Exquisite silver, pearl, and rudraksha designs' },
      { name: 'Rakhi Combos', description: 'Rakhis with chocolates or sweets' },
      { name: 'Gifts', description: 'Gift hampers and cards' },
    ];
    await Category.insertMany(categories);
    console.log('Categories seeded.');

    console.log('Seeding coupons...');
    const coupons = [
      {
        code: 'RAKHI50',
        type: 'fixed',
        value: 50,
        minimumOrderValue: 299,
        isActive: true,
      },
      {
        code: 'RAKHI10',
        type: 'percentage',
        value: 10,
        minimumOrderValue: 499,
        maximumDiscount: 150,
        isActive: true,
      },
      {
        code: 'WELCOME15',
        type: 'percentage',
        value: 15,
        minimumOrderValue: 199,
        maximumDiscount: 100,
        isActive: true,
      },
    ];
    await Coupon.insertMany(coupons);
    console.log('Coupons seeded.');

    console.log('Seeding societies...');
    const societies = [
      {
        name: 'Smart World Gems',
        isActive: true,
        blocks: [
          { name: 'Tower A', floors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
          { name: 'Tower B', floors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
          { name: 'Tower J', floors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        ],
      },
      {
        name: 'DLF The Primus',
        isActive: true,
        blocks: [
          { name: 'Block 1', floors: [1, 2, 3, 4, 5, 12, 14, 15] },
          { name: 'Block 2', floors: [1, 2, 3, 4, 5, 12, 14, 15] },
          { name: 'Block 3', floors: [1, 2, 3, 4, 5, 12, 14, 15] },
        ],
      },
      {
        name: 'M3M Golf Hills',
        isActive: true,
        blocks: [
          { name: 'Tower H1', floors: [1, 2, 3, 4, 5, 6, 7, 8, 12, 14, 15, 16] },
          { name: 'Tower H2', floors: [1, 2, 3, 4, 5, 6, 7, 8, 12, 14, 15, 16] },
        ],
      },
    ];
    await Society.insertMany(societies);
    console.log('Societies seeded.');

    console.log('Seeding products...');
    const products = [
      {
        name: 'Royal Pearl Rakhi',
        description: 'An elegant Rakhi crafted with genuine freshwater pearls and gold beads, symbolizing purity and affection.',
        imageUrl: 'https://images.unsplash.com/photo-1627916503930-b3e34b17a10a?w=600&auto=format&fit=crop&q=60',
        price: 299,
        discountedPrice: 199,
        category: 'Premium Rakhis',
        stock: 25,
        isAvailable: true,
      },
      {
        name: 'Designer Stone Rakhi',
        description: 'Vibrant and modern Rakhi adorned with colorful stones, kundans, and delicate threadwork.',
        imageUrl: 'https://images.unsplash.com/photo-1626244673620-b44c4fae8de2?w=600&auto=format&fit=crop&q=60',
        price: 399,
        discountedPrice: 249,
        category: 'Designer Rakhis',
        stock: 30,
        isAvailable: true,
      },
      {
        name: 'Traditional Mauli Rakhi',
        description: 'The sacred red and yellow Mauli thread Rakhi with simple rudraksha and sandalwood accents for custom rituals.',
        imageUrl: 'https://images.unsplash.com/photo-1626244673809-b684534ef03f?w=600&auto=format&fit=crop&q=60',
        price: 99,
        discountedPrice: 79,
        category: 'Traditional Rakhis',
        stock: 50,
        isAvailable: true,
      },
      {
        name: 'Kids Cartoon Rakhi',
        description: 'Featuring popular kids cartoon characters with adjustable rubber bands. Extremely popular with children!',
        imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=60',
        price: 149,
        discountedPrice: 119,
        category: 'Kids Rakhis',
        stock: 40,
        isAvailable: true,
      },
      {
        name: 'Premium Rudraksha Rakhi',
        description: 'Spiritual Rakhi crafted with genuine Panchmukhi Rudraksha beads, gold caps, and premium red thread.',
        imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=60',
        price: 349,
        discountedPrice: 229,
        category: 'Premium Rakhis',
        stock: 20,
        isAvailable: true,
      },
      {
        name: 'Bhaiya-Bhabhi Rakhi Combo',
        description: 'Matching designer Rakhi set for Bhaiya and Bhabhi, including a beautiful Lumba for Bhabhi.',
        imageUrl: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=600&auto=format&fit=crop&q=60',
        price: 499,
        discountedPrice: 349,
        category: 'Bhaiya-Bhabhi Combos',
        stock: 15,
        isAvailable: true,
      },
      {
        name: 'Pure Silver Rakhi',
        description: 'Exquisite floral design crafted in 92.5 pure silver, wearable later as a stylish bracelet.',
        imageUrl: 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=60',
        price: 899,
        discountedPrice: 699,
        category: 'Premium Rakhis',
        stock: 10,
        isAvailable: true,
      },
      {
        name: 'Floral Gota Patti Rakhi',
        description: 'Beautiful handmade Rakhi styled with Gota Patti floral elements, pearls, and soft yellow threads.',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=60',
        price: 199,
        discountedPrice: 149,
        category: 'Traditional Rakhis',
        stock: 35,
        isAvailable: true,
      },
      {
        name: 'Kids Light-up Superhero Rakhi',
        description: 'Vibrant Rakhi that glows up with a tap, styled with cool superhero characters that kids love.',
        imageUrl: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=600&auto=format&fit=crop&q=60',
        price: 199,
        discountedPrice: 159,
        category: 'Kids Rakhis',
        stock: 25,
        isAvailable: true,
      },
      {
        name: 'Premium Kaju Katli Rakhi Combo',
        description: 'Designer Kundan Rakhi packaged with a box of premium 250g fresh Kaju Katli sweets and Roli Chawal pack.',
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=60',
        price: 599,
        discountedPrice: 449,
        category: 'Rakhi Combos',
        stock: 12,
        isAvailable: true,
      },
    ];
    await Product.insertMany(products);
    console.log('Products seeded.');

    console.log('Seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

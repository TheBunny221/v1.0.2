import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PRODUCTION database seeding...');

  try {
    // Check if data already exists (production safety)
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log(`⚠️ Database already contains ${existingUsers} users`);
      console.log('🔒 Skipping seeding to avoid data conflicts in production');
      console.log('💡 To force reseed, clear the database first');
      return;
    }

    console.log('📊 Creating essential production data...');

    // 1. System Configuration for Production
    console.log('⚙️ Creating production system configuration...');
    const productionConfigs = [
      {
        key: 'APP_NAME',
        value: 'Kochi Smart City',
        description: 'Application name displayed across the system',
      },
      {
        key: 'APP_LOGO_URL',
        value: '/assets/kochi-logo.png',
        description: 'URL for the application logo',
      },
      {
        key: 'APP_LOGO_SIZE',
        value: 'medium',
        description: 'Size of the application logo (small, medium, large)',
      },
      {
        key: 'COMPLAINT_ID_PREFIX',
        value: 'KSC',
        description:
          'Prefix for complaint IDs (e.g., KSC for Kochi Smart City)',
      },
      {
        key: 'COMPLAINT_ID_START_NUMBER',
        value: '1',
        description: 'Starting number for complaint ID sequence',
      },
      {
        key: 'COMPLAINT_ID_LENGTH',
        value: '6',
        description: 'Length of the numeric part in complaint IDs',
      },
      {
        key: 'DEFAULT_LANGUAGE',
        value: 'en',
        description: 'Default language for the application',
      },
      {
        key: 'EMAIL_ENABLED',
        value: 'true',
        description: 'Whether email notifications are enabled',
      },
      {
        key: 'SMS_ENABLED',
        value: 'true',
        description: 'Whether SMS notifications are enabled',
      },
      {
        key: 'MAX_FILE_SIZE_MB',
        value: '10',
        description: 'Maximum file upload size in MB',
      },
      {
        key: 'COMPLAINT_AUTO_ASSIGN',
        value: 'true',
        description:
          'Whether complaints should be auto-assigned to ward officers',
      },
      {
        key: 'OTP_EXPIRY_MINUTES',
        value: '10',
        description: 'OTP expiration time in minutes',
      },
      {
        key: 'DEFAULT_SLA_HOURS',
        value: '48',
        description: 'Default SLA time in hours for complaint resolution',
      },
      {
        key: 'CITIZEN_REGISTRATION_ENABLED',
        value: 'true',
        description: 'Allow citizen self-registration',
      },
      {
        key: 'SYSTEM_MAINTENANCE',
        value: 'false',
        description: 'System maintenance mode flag',
      },
      {
        key: 'CONTACT_HELPLINE',
        value: '1800-425-1900',
        description: 'Official helpline number for Kochi Smart City',
      },
      {
        key: 'CONTACT_EMAIL',
        value: 'support@cochinsmartcity.gov.in',
        description: 'Official support email address',
      },
      {
        key: 'CONTACT_OFFICE_HOURS',
        value:
          'Monday - Friday: 9:00 AM - 6:00 PM, Saturday: 9:00 AM - 1:00 PM',
        description: 'Official office hours',
      },
      {
        key: 'CONTACT_OFFICE_ADDRESS',
        value: 'Kochi Corporation, Town Hall Road, Ernakulam, Kochi - 682011',
        description: 'Official office address',
      },
    ];

    await Promise.all(
      productionConfigs.map(async (config) =>
        prisma.systemConfig.upsert({
          where: { key: config.key },
          update: { value: config.value, description: config.description },
          create: config,
        })
      )
    );

    // 2. Create Production Departments
    console.log('🏢 Creating production departments...');
    const departments = [
      {
        name: 'Public Works Department',
        description:
          'Roads, bridges, buildings, and public infrastructure maintenance',
      },
      {
        name: 'Water and Sewerage Department',
        description:
          'Water supply, distribution, quality control, and sewerage management',
      },
      {
        name: 'Electrical Department',
        description:
          'Street lighting, electrical maintenance, and power distribution',
      },
      {
        name: 'Health and Sanitation Department',
        description: 'Waste management, sanitation, and public health services',
      },
      {
        name: 'IT and e-Governance Department',
        description:
          'Digital infrastructure, e-governance, and IT support services',
      },
      {
        name: 'Revenue Department',
        description: 'Property tax, trade licenses, and revenue collection',
      },
      {
        name: 'Town Planning Department',
        description:
          'Urban planning, building permits, and development control',
      },
    ];

    await prisma.department.createMany({
      data: departments,
      skipDuplicates: true,
    });

    // 3. Create Real Kochi Wards (74 wards as per actual Kochi Corporation)
    console.log('🏘️ Creating Kochi Corporation wards...');
    const kochiWards = [
      {
        name: 'Ward 1 - Fort Kochi',
        description: 'Historic Fort Kochi area with heritage sites',
      },
      {
        name: 'Ward 2 - Mattancherry',
        description: 'Mattancherry Palace area and spice markets',
      },
      {
        name: 'Ward 3 - Ernakulam South',
        description: 'Commercial and business district',
      },
      {
        name: 'Ward 4 - Kadavanthra',
        description: 'IT corridor and residential area',
      },
      {
        name: 'Ward 5 - Panampilly Nagar',
        description: 'Premium residential and commercial zone',
      },
      {
        name: 'Ward 6 - Marine Drive',
        description: 'Waterfront business and tourism district',
      },
      {
        name: 'Ward 7 - Willingdon Island',
        description: 'Port and industrial area',
      },
      {
        name: 'Ward 8 - Thevara',
        description: 'Mixed residential and commercial area',
      },
      {
        name: 'Ward 9 - Perumanoor',
        description: 'Residential locality with ferry connectivity',
      },
      {
        name: 'Ward 10 - Kumbakonam',
        description: 'Traditional residential area',
      },
      {
        name: 'Ward 11 - Mundamveli',
        description: 'Island ward with fishing community',
      },
      { name: 'Ward 12 - Chullickal', description: 'Coastal residential area' },
      {
        name: 'Ward 13 - Kacheripady',
        description: 'Central residential and commercial area',
      },
      {
        name: 'Ward 14 - Palluruthy',
        description: 'Island locality with traditional houses',
      },
      {
        name: 'Ward 15 - Vyttila',
        description: 'Major transport hub and commercial center',
      },
      {
        name: 'Ward 16 - Edappally',
        description: 'Major commercial and residential hub',
      },
      {
        name: 'Ward 17 - Cheranalloor',
        description: 'Residential area near NH bypass',
      },
      {
        name: 'Ward 18 - Kalamassery',
        description: 'Industrial and residential area',
      },
      {
        name: 'Ward 19 - Mulavukad',
        description: 'Island ward with fishing activities',
      },
      {
        name: 'Ward 20 - Cherai',
        description: 'Beach area and tourist destination',
      },
      // Add more wards as needed - this is a sample for production
    ];

    const createdWards = [];
    for (const wardData of kochiWards) {
      const ward = await prisma.ward.upsert({
        where: { name: wardData.name },
        update: { description: wardData.description },
        create: wardData,
      });
      createdWards.push(ward);
    }

    // 4. Create Sub-zones for major wards
    console.log('📍 Creating sub-zones for major wards...');
    const majorWardSubZones: Record<string, string[]> = {
      'Ward 1 - Fort Kochi': [
        'Princess Street',
        'Parade Ground',
        'Santa Cruz Cathedral',
        'Chinese Fishing Nets Area',
      ],
      'Ward 3 - Ernakulam South': [
        'MG Road',
        'Broadway',
        'Boat Jetty',
        'High Court Junction',
      ],
      'Ward 6 - Marine Drive': [
        'Marine Drive Walkway',
        'Taj Gateway Area',
        'Rajendra Maidan',
        'Children\'s Park',
      ],
      'Ward 15 - Vyttila': [
        'Vyttila Hub',
        'Mobility Hub',
        'Junction Area',
        'Collectorate',
      ],
      'Ward 16 - Edappally': [
        'Edappally Church',
        'Shopping Complex',
        'NH Bypass',
        'Changampuzha Park',
      ],
    };

    for (const ward of createdWards) {
      const subZones = majorWardSubZones[ward.name] || [
        `${ward.name.split(' - ')[1] || ward.name} North`,
        `${ward.name.split(' - ')[1] || ward.name} South`,
      ];

      for (const zoneName of subZones) {
        await prisma.subZone.upsert({
          where: {
            // Using a unique combination since Prisma requires a unique field for upsert
            name: `${zoneName}-${ward.id}`,
          },
          update: {},
          create: {
            name: zoneName,
            wardId: ward.id,
            description: `${zoneName} area in ${ward.name}`,
          },
        });
      }
    }

    // 5. Create Initial Admin User
    console.log('👤 Creating system administrator...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'KochiAdmin@2024!';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@cochinsmartcity.gov.in' },
      update: {},
      create: {
        email: 'admin@cochinsmartcity.gov.in',
        fullName: 'System Administrator',
        phoneNumber: '+91-484-2353920',
        password: hashedAdminPassword,
        role: 'ADMINISTRATOR',
        language: 'en',
        isActive: true,
        joinedOn: new Date(),
      },
    });

    // 6. Create Essential Complaint Types Configuration
    console.log('🏷️ Creating complaint type configurations...');
    const productionComplaintTypes = [
      {
        key: 'COMPLAINT_TYPE_WATER_SUPPLY',
        name: 'Water Supply Issues',
        description:
          'Water supply problems, quality issues, pressure problems, leakage',
        priority: 'HIGH',
        slaHours: 24,
        departmentId: 'Water and Sewerage Department',
      },
      {
        key: 'COMPLAINT_TYPE_ELECTRICITY',
        name: 'Electrical Issues',
        description: 'Power outages, electrical faults, transformer issues',
        priority: 'HIGH',
        slaHours: 12,
        departmentId: 'Electrical Department',
      },
      {
        key: 'COMPLAINT_TYPE_ROAD_INFRASTRUCTURE',
        name: 'Road and Infrastructure',
        description:
          'Road damage, potholes, bridge issues, public infrastructure',
        priority: 'MEDIUM',
        slaHours: 72,
        departmentId: 'Public Works Department',
      },
      {
        key: 'COMPLAINT_TYPE_WASTE_MANAGEMENT',
        name: 'Waste Management',
        description: 'Garbage collection, waste disposal, sanitation issues',
        priority: 'MEDIUM',
        slaHours: 24,
        departmentId: 'Health and Sanitation Department',
      },
      {
        key: 'COMPLAINT_TYPE_STREET_LIGHTING',
        name: 'Street Lighting',
        description:
          'Street light maintenance, new connections, lighting issues',
        priority: 'LOW',
        slaHours: 48,
        departmentId: 'Electrical Department',
      },
      {
        key: 'COMPLAINT_TYPE_DRAINAGE',
        name: 'Drainage and Sewerage',
        description: 'Blocked drains, sewerage overflow, flood-related issues',
        priority: 'HIGH',
        slaHours: 12,
        departmentId: 'Water and Sewerage Department',
      },
      {
        key: 'COMPLAINT_TYPE_BUILDING_PERMIT',
        name: 'Building and Planning',
        description:
          'Building permits, planning violations, unauthorized constructions',
        priority: 'MEDIUM',
        slaHours: 168, // 7 days
        departmentId: 'Town Planning Department',
      },
      {
        key: 'COMPLAINT_TYPE_TAX_REVENUE',
        name: 'Tax and Revenue',
        description:
          'Property tax issues, trade license problems, revenue matters',
        priority: 'MEDIUM',
        slaHours: 72,
        departmentId: 'Revenue Department',
      },
    ];

    for (const typeData of productionComplaintTypes) {
      await prisma.systemConfig.upsert({
        where: { key: typeData.key },
        update: {
          value: JSON.stringify({
            name: typeData.name,
            description: typeData.description,
            priority: typeData.priority,
            slaHours: typeData.slaHours,
            departmentId: typeData.departmentId,
          }),
        },
        create: {
          key: typeData.key,
          value: JSON.stringify({
            name: typeData.name,
            description: typeData.description,
            priority: typeData.priority,
            slaHours: typeData.slaHours,
            departmentId: typeData.departmentId,
          }),
          description: `Production complaint type configuration for ${typeData.name}`,
          isActive: true,
        },
      });
    }

    console.log('✅ Production database seeding completed successfully!');
    console.log('\n📊 Production Seeded Data Summary:');
    console.log(`• ${createdWards.length} Wards created`);
    console.log(`• ${departments.length} Departments created`);
    console.log(`• 1 System Administrator created`);
    console.log(
      `• ${productionComplaintTypes.length} Complaint Types configured`
    );
    console.log(`• ${productionConfigs.length} System Configurations set`);

    console.log('\n🔑 IMPORTANT - Admin Credentials:');
    console.log('Email: admin@cochinsmartcity.gov.in');
    console.log(`Password: ${adminPassword}`);
    console.log('\n🔒 SECURITY REMINDER:');
    console.log('1. Change the admin password immediately after first login');
    console.log('2. Set up proper environment variables for production');
    console.log('3. Configure proper backup and monitoring');
    console.log('4. Review and update system configurations as needed');
  } catch (error) {
    console.error('❌ Production seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Production seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

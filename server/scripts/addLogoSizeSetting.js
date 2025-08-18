import { getPrisma } from '../db/connection.js';

const prisma = getPrisma();

async function addLogoSizeSetting() {
  try {
    console.log('🔧 Adding APP_LOGO_SIZE setting to system configuration...');
    
    // Check if it already exists
    const existingSetting = await prisma.systemConfig.findUnique({
      where: { key: 'APP_LOGO_SIZE' }
    });

    if (existingSetting) {
      console.log('✅ APP_LOGO_SIZE setting already exists:', existingSetting);
      return;
    }

    // Create the new setting
    const newSetting = await prisma.systemConfig.create({
      data: {
        key: 'APP_LOGO_SIZE',
        value: 'medium',
        description: 'Size of the application logo (small, medium, large)',
      }
    });

    console.log('✅ APP_LOGO_SIZE setting added successfully:', newSetting);
  } catch (error) {
    console.error('❌ Error adding APP_LOGO_SIZE setting:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLogoSizeSetting();

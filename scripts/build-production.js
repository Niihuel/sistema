#!/usr/bin/env node
/**
 * Production Build Script
 * Prepares and builds the application for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n📦 ${description}...`, colors.cyan);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    console.error(error.message);
    return false;
  }
}

async function buildForProduction() {
  log('\n🚀 Starting Production Build Process\n', colors.bright + colors.green);

  // 1. Check Node version
  const nodeVersion = process.version;
  log(`📌 Node.js version: ${nodeVersion}`, colors.yellow);

  if (parseInt(nodeVersion.split('.')[0].substring(1)) < 18) {
    log('❌ Node.js 18 or higher is required', colors.red);
    process.exit(1);
  }

  // 2. Clean previous builds
  log('\n🧹 Cleaning previous builds...', colors.yellow);
  const dirsToClean = ['.next', 'out', 'dist'];
  dirsToClean.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log(`   Removed ${dir}/`, colors.cyan);
    }
  });

  // 3. Clean node_modules cache
  if (!runCommand('npm cache clean --force', 'Cleaning npm cache')) {
    log('⚠️  Cache clean failed, continuing...', colors.yellow);
  }

  // 4. Install dependencies
  if (!runCommand('npm ci --prefer-offline --no-audit', 'Installing dependencies')) {
    log('Trying with regular npm install...', colors.yellow);
    if (!runCommand('npm install', 'Installing dependencies (fallback)')) {
      process.exit(1);
    }
  }

  // 5. Generate Prisma client
  if (!runCommand('npm run prisma:generate', 'Generating Prisma client')) {
    log('⚠️  Prisma generation failed, continuing...', colors.yellow);
  }

  // 6. Type checking
  log('\n🔍 Running type checks...', colors.yellow);
  if (!runCommand('npx tsc --noEmit', 'Type checking')) {
    log('⚠️  Type errors found but continuing build...', colors.yellow);
  }

  // 7. Linting
  log('\n✨ Running linter...', colors.yellow);
  if (!runCommand('npm run lint', 'Linting code')) {
    log('⚠️  Linting warnings found but continuing...', colors.yellow);
  }

  // 8. Set production environment
  process.env.NODE_ENV = 'production';
  log('\n🔧 Environment set to: PRODUCTION', colors.green);

  // 9. Build the application
  log('\n🏗️  Building Next.js application...', colors.bright + colors.cyan);
  if (!runCommand('npm run build', 'Building application')) {
    log('❌ Build failed!', colors.red);
    process.exit(1);
  }

  // 10. Verify build output
  log('\n📊 Verifying build output...', colors.yellow);
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    log('❌ Build output not found!', colors.red);
    process.exit(1);
  }

  const buildStats = {
    standalone: fs.existsSync(path.join(nextDir, 'standalone')),
    static: fs.existsSync(path.join(nextDir, 'static')),
    server: fs.existsSync(path.join(nextDir, 'server')),
  };

  log('Build output found:', colors.green);
  Object.entries(buildStats).forEach(([key, exists]) => {
    log(`   ${exists ? '✅' : '❌'} .next/${key}`, exists ? colors.green : colors.red);
  });

  // 11. Create production info file
  const buildInfo = {
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    npmVersion: execSync('npm -v').toString().trim(),
    environment: 'production',
    host: '192.168.0.219',
    port: 4250,
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  log('\n📄 Build info saved to build-info.json', colors.green);

  // 12. Final success message
  log('\n' + '='.repeat(50), colors.bright);
  log('🎉 Production build completed successfully!', colors.bright + colors.green);
  log('='.repeat(50) + '\n', colors.bright);

  log('Next steps:', colors.yellow);
  log('1. Copy .env.production to .env.local', colors.cyan);
  log('2. Run: npm start', colors.cyan);
  log('3. Access: http://192.168.0.219:4250', colors.cyan);
  log('\n');
}

// Run the build
buildForProduction().catch(error => {
  log(`\n❌ Build failed with error: ${error.message}`, colors.red);
  process.exit(1);
});
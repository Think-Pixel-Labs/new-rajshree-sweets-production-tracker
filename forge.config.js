module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      './public/data/production.db',
      './public'
    ],
    icon: './public/assets/logo',
    osxSign: {
      identity: null,
      hardenedRuntime: true,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'gatekeeper-assess': false
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'production_tracker',
        authors: 'Think Pixel Labs',
        description: 'Production tracker for New Rajshree Sweets',
        exe: 'Production Tracker.exe',
        setupExe: 'Production Tracker Setup.exe',
        setupIcon: './public/assets/logo.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        format: 'ULFO'
      }
    }
  ]
}; 
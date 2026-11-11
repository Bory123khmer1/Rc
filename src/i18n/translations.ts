import { Language } from '../types/hardware';

export interface TranslationStrings {
  appName: string;
  nav: {
    dashboard: string;
    cars: string;
    sessions: string;
    receivers: string;
    history: string;
    reports: string;
    settings: string;
  };
  modes: {
    demoMode: string;
    liveHardwareMode: string;
    demoNotice: string;
    liveConnected: string;
    liveDisconnected: string;
    switchToDemo: string;
    switchToLive: string;
  };
  metrics: {
    masterStatus: string;
    totalCars: string;
    availableCars: string;
    carsInUse: string;
    offlineReceivers: string;
    activeSessions: string;
    todayPlays: string;
    todayRevenue: string;
  };
  status: {
    connected: string;
    disconnected: string;
    demoSimulated: string;
    available: string;
    inUse: string;
    offline: string;
    unconfigured: string;
    stopping: string;
    relayOn: string;
    relayOff: string;
    completed: string;
    stoppedEarly: string;
    emergencyStopped: string;
    commFailure: string;
  };
  actions: {
    start: string;
    stop: string;
    emergencyStop: string;
    selectCar: string;
    selected: string;
    save: string;
    cancel: string;
    edit: string;
    reset: string;
    verifyConnection: string;
    exportCsv: string;
    clearHistory: string;
    setupDemoReceivers: string;
    disconnectAllSim: string;
  };
  sessionControl: {
    title: string;
    subtitle: string;
    step1SelectCar: string;
    step2SelectDuration: string;
    step3ConfirmStart: string;
    minutes: string;
    minShort: string;
    activeSessionList: string;
    noActiveSessions: string;
    remainingTime: string;
    targetReceiver: string;
    targetMac: string;
    playPrice: string;
  };
  carManagement: {
    title: string;
    subtitle: string;
    carNumber: string;
    carName: string;
    receiverNumber: string;
    macAddress: string;
    macPlaceholder: string;
    remotePlacementNote: string;
    wiringSafetyWarning: string;
    wiringVerifiedLabel: string;
    editCarTitle: string;
  };
  receiverManagement: {
    title: string;
    subtitle: string;
    architectureNote: string;
    masterController: string;
    espNowChannel: string;
    heartbeatMonitor: string;
    lastHeartbeat: string;
    relayStatus: string;
    simToggleOnline: string;
    simToggleOffline: string;
    apiLogTitle: string;
    noLogs: string;
  };
  historyPage: {
    title: string;
    subtitle: string;
    sessionId: string;
    car: string;
    startTime: string;
    endTime: string;
    duration: string;
    status: string;
    price: string;
    revenue: string;
    noHistory: string;
    filterAll: string;
  };
  reportsPage: {
    title: string;
    subtitle: string;
    totalRevenueToday: string;
    totalRevenueAllTime: string;
    totalCompletedPlays: string;
    avgPlayDuration: string;
    revenueByCar: string;
    revenueByDuration: string;
    playsCount: string;
  };
  settingsPage: {
    title: string;
    subtitle: string;
    businessSection: string;
    businessName: string;
    currency: string;
    pricePerPlay: string;
    availableDurations: string;
    numberOfCars: string;
    hardwareSection: string;
    masterIpAddress: string;
    authToken: string;
    safetySection: string;
    autoStopHeartbeat: string;
    requireWiringCheck: string;
    confirmEmergencyStop: string;
    soundAlerts: string;
    savedSuccess: string;
  };
  errors: {
    receiverOffline: string;
    macNotConfigured: string;
    invalidMacFormat: string;
    carAlreadyInUse: string;
    wiringNotVerified: string;
    masterUnreachable: string;
    selectCarFirst: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  en: {
    appName: 'RC Playground',
    nav: {
      dashboard: 'Dashboard',
      cars: 'Cars',
      sessions: 'Session Control',
      receivers: 'Receivers',
      history: 'Play History',
      reports: 'Revenue',
      settings: 'Settings',
    },
    modes: {
      demoMode: 'Demo Mode (No Hardware Connected)',
      liveHardwareMode: 'Live Hardware Mode (ESP32 Master)',
      demoNotice:
        'Running in local Demo Mode. Hardware states are simulated for testing and do not represent physical ESP32 relays.',
      liveConnected: 'Connected to ESP32-WROOM-32 Master via Local Wi-Fi',
      liveDisconnected: 'ESP32 Master Unreachable on Local Wi-Fi',
      switchToDemo: 'Use Demo Mode',
      switchToLive: 'Connect Live ESP32',
    },
    metrics: {
      masterStatus: 'Master Status',
      totalCars: 'Total Cars',
      availableCars: 'Available Cars',
      carsInUse: 'Cars in Use',
      offlineReceivers: 'Offline Receivers',
      activeSessions: 'Active Sessions',
      todayPlays: "Today's Plays",
      todayRevenue: "Today's Revenue",
    },
    status: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      demoSimulated: 'Demo Simulation',
      available: 'Available',
      inUse: 'In Use',
      offline: 'Offline',
      unconfigured: 'MAC Not Set',
      stopping: 'Stopping...',
      relayOn: 'Relay ON',
      relayOff: 'Relay OFF',
      completed: 'Completed',
      stoppedEarly: 'Stopped Early',
      emergencyStopped: 'Emergency Stop',
      commFailure: 'Comm Failure',
    },
    actions: {
      start: 'START',
      stop: 'STOP',
      emergencyStop: 'EMERGENCY STOP',
      selectCar: 'Select Car',
      selected: 'Selected',
      save: 'Save Changes',
      cancel: 'Cancel',
      edit: 'Configure',
      reset: 'Reset',
      verifyConnection: 'Ping ESP32 Master',
      exportCsv: 'Export CSV',
      clearHistory: 'Clear History',
      setupDemoReceivers: 'Load Test Receiver MACs (Demo Only)',
      disconnectAllSim: 'Set All Offline (Demo)',
    },
    sessionControl: {
      title: 'Session Control',
      subtitle: 'Select an available car, choose play duration, and send confirmed ESP-NOW start commands.',
      step1SelectCar: '1. Select Car & Receiver',
      step2SelectDuration: '2. Select Play Duration',
      step3ConfirmStart: '3. Confirm & Start Relay Timer',
      minutes: 'Minutes',
      minShort: 'min',
      activeSessionList: 'Current Active Sessions',
      noActiveSessions: 'No active car sessions running right now. All relays are OFF.',
      remainingTime: 'Time Remaining',
      targetReceiver: 'Target Receiver',
      targetMac: 'Target MAC',
      playPrice: 'Session Price',
    },
    carManagement: {
      title: 'Car Management',
      subtitle: 'Configure car names, pair ESP32 Receiver MAC addresses, and verify RC remote relay wiring.',
      carNumber: 'Car Unit',
      carName: 'Car Name',
      receiverNumber: 'Assigned Receiver',
      macAddress: 'Receiver MAC Address',
      macPlaceholder: 'e.g. AA:BB:CC:DD:EE:01',
      remotePlacementNote:
        'Hardware Placement: Each ESP32 Receiver + Relay is installed beside its original RC remote controller, NOT inside the car.',
      wiringSafetyWarning:
        'Safety Requirement: Do not assume cutting RC remote battery power is safe until the specific remote switch and battery wiring are verified.',
      wiringVerifiedLabel: 'RC remote & relay wiring verified safe',
      editCarTitle: 'Edit Car & Receiver Configuration',
    },
    receiverManagement: {
      title: 'Receiver & ESP-NOW Link',
      subtitle: 'Monitor ESP32-WROOM-32 Master to Receiver ESP-NOW communication, heartbeats, and relay states.',
      architectureNote: '1 ESP32 Master (Wi-Fi Web Server) → ESP-NOW → 4 ESP32 Receivers + 4 Relay Modules (Beside RC Remotes)',
      masterController: 'ESP32-WROOM-32 Master',
      espNowChannel: 'ESP-NOW Link',
      heartbeatMonitor: 'Heartbeat Status',
      lastHeartbeat: 'Last Heartbeat',
      relayStatus: 'Relay Output',
      simToggleOnline: 'Simulate Online',
      simToggleOffline: 'Simulate Offline',
      apiLogTitle: 'Hardware Adapter Command Log',
      noLogs: 'No hardware commands sent in this session yet.',
    },
    historyPage: {
      title: 'Play History',
      subtitle: 'Complete audit log of every RC car play session, duration, stop status, and collected revenue.',
      sessionId: 'Session ID',
      car: 'Car',
      startTime: 'Start Time',
      endTime: 'End Time',
      duration: 'Duration',
      status: 'Status',
      price: 'Play Price',
      revenue: 'Revenue',
      noHistory: 'No play sessions recorded yet. Start a car session to log history.',
      filterAll: 'All Cars',
    },
    reportsPage: {
      title: 'Revenue Reports',
      subtitle: 'Financial summary and utilization breakdown by car unit and session duration.',
      totalRevenueToday: "Today's Revenue",
      totalRevenueAllTime: 'Total Recorded Revenue',
      totalCompletedPlays: 'Total Plays',
      avgPlayDuration: 'Average Duration',
      revenueByCar: 'Performance by Car Unit',
      revenueByDuration: 'Breakdown by Play Duration',
      playsCount: 'Plays',
    },
    settingsPage: {
      title: 'Business & Hardware Settings',
      subtitle: 'Configure pricing, currency (USD/KHR), play durations, ESP32 Master IP, and safety rules.',
      businessSection: 'Business & Pricing',
      businessName: 'Business Name',
      currency: 'Active Currency',
      pricePerPlay: 'Standard Price per Play',
      availableDurations: 'Available Play Durations (Minutes)',
      numberOfCars: 'Number of Cars (1–8)',
      hardwareSection: 'ESP32 Master Network Configuration',
      masterIpAddress: 'ESP32 Master Local URL / IP',
      authToken: 'Master Authorization Key (Header Token)',
      safetySection: 'Safety & Relay Interlocks',
      autoStopHeartbeat: 'Auto-stop session if receiver heartbeat is lost',
      requireWiringCheck: 'Require remote wiring verification before START',
      confirmEmergencyStop: 'Ask confirmation before Emergency Stop',
      soundAlerts: 'Play audio tone when timer finishes',
      savedSuccess: 'Settings saved to local storage.',
    },
    errors: {
      receiverOffline: 'Cannot start: Assigned receiver is offline. Confirm ESP-NOW link first.',
      macNotConfigured: 'Cannot start: Receiver MAC address is not configured.',
      invalidMacFormat: 'Invalid MAC address format. Use 6 hex pairs (e.g. 24:6F:28:1A:2B:01).',
      carAlreadyInUse: 'Cannot start: This car is already running an active session.',
      wiringNotVerified: 'Safety block: Verify RC remote and battery relay wiring in Car Management before starting.',
      masterUnreachable: 'ESP32 Master did not respond. Verify local Wi-Fi connection and Master IP.',
      selectCarFirst: 'Please select a car first.',
    },
  },
  km: {
    appName: 'ទីលានឡានបញ្ជា RC',
    nav: {
      dashboard: 'ផ្ទាំងគ្រប់គ្រង',
      cars: 'គ្រប់គ្រងឡាន',
      sessions: 'បញ្ជាម៉ោងលេង',
      receivers: 'ឧបករណ៍ទទួល',
      history: 'ប្រវត្តិលេង',
      reports: 'របាយការណ៍ចំណូល',
      settings: 'ការកំណត់',
    },
    modes: {
      demoMode: 'ម៉ូដសាកល្បង (គ្មានឧបករណ៍ភ្ជាប់)',
      liveHardwareMode: 'ម៉ូដភ្ជាប់ឧបករណ៍ពិត (ESP32 Master)',
      demoNotice:
        'កំពុងដំណើរការក្នុងម៉ូដសាកល្បង (Demo Mode)។ ស្ថានភាពឧបករណ៍គឺសម្រាប់សាកល្បងតែប៉ុណ្ណោះ មិនទាន់ភ្ជាប់ ESP32 ពិតប្រាកដទេ។',
      liveConnected: 'បានភ្ជាប់ទៅកាន់ ESP32-WROOM-32 Master តាម Wi-Fi',
      liveDisconnected: 'មិនអាចភ្ជាប់ទៅកាន់ ESP32 Master តាម Wi-Fi បានទេ',
      switchToDemo: 'ប្រើម៉ូដសាកល្បង',
      switchToLive: 'ភ្ជាប់ ESP32 ពិត',
    },
    metrics: {
      masterStatus: 'ស្ថានភាព Master',
      totalCars: 'ចំនួនឡានសរុប',
      availableCars: 'ឡានទំនេរ',
      carsInUse: 'ឡានកំពុងលេង',
      offlineReceivers: 'ឧបករណ៍ដាច់សេវា',
      activeSessions: 'វគ្គកំពុងដំណើរការ',
      todayPlays: 'ចំនួនលេងថ្ងៃនេះ',
      todayRevenue: 'ចំណូលថ្ងៃនេះ',
    },
    status: {
      connected: 'បានភ្ជាប់',
      disconnected: 'ដាច់ការភ្ជាប់',
      demoSimulated: 'កំពុងសាកល្បង',
      available: 'ទំនេរ',
      inUse: 'កំពុងលេង',
      offline: 'ដាច់សេវា',
      unconfigured: 'មិនទាន់ដាក់ MAC',
      stopping: 'កំពុងបិទ...',
      relayOn: 'កុងតាក់បើក (ON)',
      relayOff: 'កុងតាក់បិទ (OFF)',
      completed: 'ចប់ម៉ោងត្រឹមត្រូវ',
      stoppedEarly: 'បញ្ឈប់មុនម៉ោង',
      emergencyStopped: 'បញ្ឈប់បន្ទាន់',
      commFailure: 'ដាច់សេវាទាក់ទង',
    },
    actions: {
      start: 'ចាប់ផ្តើម (START)',
      stop: 'បញ្ឈប់ (STOP)',
      emergencyStop: 'បញ្ឈប់បន្ទាន់ទាំងអស់',
      selectCar: 'ជ្រើសរើសឡាន',
      selected: 'បានជ្រើសរើស',
      save: 'រក្សាទុក',
      cancel: 'បោះបង់',
      edit: 'កែប្រែ',
      reset: 'កំណត់ឡើងវិញ',
      verifyConnection: 'ពិនិត្យការភ្ជាប់ ESP32',
      exportCsv: 'ទាញយក CSV',
      clearHistory: 'លុបប្រវត្តិ',
      setupDemoReceivers: 'ដាក់ MAC សាកល្បង (សម្រាប់ Demo)',
      disconnectAllSim: 'ផ្តាច់សេវាសាកល្បងទាំងអស់',
    },
    sessionControl: {
      title: 'ការបញ្ជាម៉ោងលេង',
      subtitle: 'ជ្រើសរើសឡានដែលទំនេរ កំណត់នាទីលេង រួចចុច START ដើម្បីបើកភ្លើងតេឡេបញ្ជា។',
      step1SelectCar: '១. ជ្រើសរើសឡាន និងឧបករណ៍ទទួល',
      step2SelectDuration: '២. ជ្រើសរើសរយៈពេលលេង',
      step3ConfirmStart: '៣. បញ្ជាក់ និងចាប់ផ្តើមរាប់ម៉ោង',
      minutes: 'នាទី',
      minShort: 'នាទី',
      activeSessionList: 'ឡានដែលកំពុងដំណើរការ',
      noActiveSessions: 'មិនមានឡានកំពុងលេងទេ។ កុងតាក់ភ្លើង (Relay) ទាំងអស់ត្រូវបានបិទ (OFF)។',
      remainingTime: 'ម៉ោងនៅសល់',
      targetReceiver: 'ឧបករណ៍ទទួលគោលដៅ',
      targetMac: 'អាសយដ្ឋាន MAC',
      playPrice: 'តម្លៃលេង',
    },
    carManagement: {
      title: 'ការគ្រប់គ្រងឡាន',
      subtitle: 'កែឈ្មោះឡាន កំណត់អាសយដ្ឋាន MAC របស់ ESP32 Receiver និងពិនិត្យសុវត្ថិភាពខ្សែភ្លើងតេឡេ។',
      carNumber: 'លេខឡាន',
      carName: 'ឈ្មោះឡាន',
      receiverNumber: 'ឧបករណ៍ទទួល (Receiver)',
      macAddress: 'អាសយដ្ឋាន MAC របស់ Receiver',
      macPlaceholder: 'ឧ. AA:BB:CC:DD:EE:01',
      remotePlacementNote:
        'ទីតាំងដំឡើង៖ ឧបករណ៍ទទួល ESP32 និង Relay ទាំងអស់ត្រូវដាក់ក្បែរតេឡេបញ្ជាដើម (មិនមែនដាក់ក្នុងតួឡានទេ)។',
      wiringSafetyWarning:
        'សុវត្ថិភាព៖ សូមពិនិត្យប្រព័ន្ធខ្សែភ្លើងថ្មតេឡេបញ្ជាឱ្យច្បាស់លាស់ មុននឹងប្រើ Relay កាត់ផ្តាច់ភ្លើងតេឡេ។',
      wiringVerifiedLabel: 'បានពិនិត្យខ្សែភ្លើងតេឡេ និង Relay ថាមានសុវត្ថិភាព',
      editCarTitle: 'កែប្រែព័ត៌មានឡាន និង MAC',
    },
    receiverManagement: {
      title: 'ឧបករណ៍ទទួល និងសេវា ESP-NOW',
      subtitle: 'តាមដានការភ្ជាប់រវាង ESP32 Master ទៅកាន់ Receiver ទាំង ៤ និងស្ថានភាពកុងតាក់ Relay។',
      architectureNote: '1 ESP32 Master (Wi-Fi Web Server) → ESP-NOW → 4 ESP32 Receivers + 4 Relays (ដាក់ក្បែរតេឡេ)',
      masterController: 'ឧបករណ៍មេ ESP32-WROOM-32',
      espNowChannel: 'បណ្តាញ ESP-NOW',
      heartbeatMonitor: 'សញ្ញាជីពចរ (Heartbeat)',
      lastHeartbeat: 'បានទទួលចុងក្រោយ',
      relayStatus: 'ស្ថានភាព Relay',
      simToggleOnline: 'ដាក់ឱ្យភ្ជាប់ (Demo)',
      simToggleOffline: 'ដាក់ឱ្យដាច់សេវា (Demo)',
      apiLogTitle: 'កំណត់ត្រាបញ្ជា Hardware API',
      noLogs: 'មិនទាន់មានកំណត់ត្រាបញ្ជាឧបករណ៍នៅឡើយទេ។',
    },
    historyPage: {
      title: 'ប្រវត្តិលេង',
      subtitle: 'បញ្ជីកត់ត្រាគ្រប់វគ្គលេង រយៈពេល ស្ថានភាពបញ្ចប់ និងចំណូលដែលទទួលបាន។',
      sessionId: 'លេខកូដវគ្គ',
      car: 'ឡាន',
      startTime: 'ម៉ោងចាប់ផ្តើម',
      endTime: 'ម៉ោងបញ្ចប់',
      duration: 'រយៈពេល',
      status: 'ស្ថានភាព',
      price: 'តម្លៃលេង',
      revenue: 'ចំណូល',
      noHistory: 'មិនទាន់មានប្រវត្តិលេងនៅឡើយទេ។',
      filterAll: 'ឡានទាំងអស់',
    },
    reportsPage: {
      title: 'របាយការណ៍ចំណូល',
      subtitle: 'សង្ខេបប្រាក់ចំណូល និងចំនួនលេងតាមឡាននីមួយៗ និងតាមរយៈពេល។',
      totalRevenueToday: 'ចំណូលថ្ងៃនេះ',
      totalRevenueAllTime: 'ចំណូលសរុបទាំងអស់',
      totalCompletedPlays: 'ចំនួនលេងសរុប',
      avgPlayDuration: 'រយៈពេលលេងមធ្យម',
      revenueByCar: 'ចំណូលតាមឡាននីមួយៗ',
      revenueByDuration: 'ចំណូលតាមកញ្ចប់នាទី',
      playsCount: 'ដង',
    },
    settingsPage: {
      title: 'ការកំណត់អាជីវកម្ម និងឧបករណ៍',
      subtitle: 'កំណត់តម្លៃ រូបិយប័ណ្ណ (USD/KHR) នាទីលេង អាសយដ្ឋាន IP របស់ ESP32 និងសុវត្ថិភាព។',
      businessSection: 'ព័ត៌មានអាជីវកម្ម និងតម្លៃ',
      businessName: 'ឈ្មោះអាជីវកម្ម',
      currency: 'រូបិយប័ណ្ណ',
      pricePerPlay: 'តម្លៃក្នុងការលេង ១ ដង',
      availableDurations: 'ជម្រើសនាទីលេង',
      numberOfCars: 'ចំនួនឡានសរុប (1–8)',
      hardwareSection: 'ការភ្ជាប់បណ្តាញ ESP32 Master',
      masterIpAddress: 'អាសយដ្ឋាន IP របស់ ESP32 Master',
      authToken: 'កូដសម្ងាត់សុវត្ថិភាព (Auth Token)',
      safetySection: 'ប្រព័ន្ធការពារសុវត្ថិភាព',
      autoStopHeartbeat: 'បិទភ្លើងស្វ័យប្រវត្តិបើដាច់សេវា Receiver',
      requireWiringCheck: 'តម្រូវឱ្យបញ្ជាក់សុវត្ថិភាពខ្សែភ្លើងមុនចុច START',
      confirmEmergencyStop: 'សួរបញ្ជាក់មុនពេលចុចបញ្ឈប់បន្ទាន់',
      soundAlerts: 'បន្លឺសំឡេងពេលអស់ម៉ោងលេង',
      savedSuccess: 'បានរក្សាទុកការកំណត់រួចរាល់។',
    },
    errors: {
      receiverOffline: 'មិនអាចចាប់ផ្តើមបានទេ៖ ឧបករណ៍ទទួល (Receiver) កំពុងដាច់សេវា។',
      macNotConfigured: 'មិនអាចចាប់ផ្តើមបានទេ៖ មិនទាន់បានកំណត់អាសយដ្ឋាន MAC របស់ Receiver ទេ។',
      invalidMacFormat: 'ទម្រង់អាសយដ្ឋាន MAC មិនត្រឹមត្រូវទេ (ឧ. 24:6F:28:1A:2B:01)។',
      carAlreadyInUse: 'មិនអាចចាប់ផ្តើមបានទេ៖ ឡាននេះកំពុងដំណើរការស្រាប់ហើយ។',
      wiringNotVerified: 'សុវត្ថិភាព៖ សូមបញ្ជាក់ថាបានពិនិត្យខ្សែភ្លើងតេឡេ និង Relay ក្នុងទំព័រគ្រប់គ្រងឡានជាមុនសិន។',
      masterUnreachable: 'មិនអាចទាក់ទងទៅ ESP32 Master បានទេ។ សូមពិនិត្យ Wi-Fi និង IP។',
      selectCarFirst: 'សូមជ្រើសរើសឡានជាមុនសិន។',
    },
  },
};

Pod::Spec.new do |s|
  s.name           = 'GruntzWatchLink'
  s.version        = '1.0.0'
  s.summary        = 'Keeps the Gruntz watch app in step with the running workout'
  s.homepage       = 'https://gruntzfit.com'
  s.license        = { :type => 'Proprietary' }
  s.author         = 'Gruntz'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'WatchConnectivity'
  s.source_files   = '**/*.swift'
end

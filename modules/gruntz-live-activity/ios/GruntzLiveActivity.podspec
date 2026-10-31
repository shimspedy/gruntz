Pod::Spec.new do |s|
  s.name           = 'GruntzLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Workout Live Activity for Gruntz'
  s.homepage       = 'https://gruntzfit.com'
  s.license        = { :type => 'Proprietary' }
  s.author         = 'Gruntz'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.swift'
end

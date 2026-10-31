Pod::Spec.new do |s|
  s.name           = 'GruntzCloudHint'
  s.version        = '1.0.0'
  s.summary        = 'iCloud key-value hints for restoring Gruntz on a new iPhone'
  s.homepage       = 'https://gruntzfit.com'
  s.license        = { :type => 'Proprietary' }
  s.author         = 'Gruntz'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.swift'
end

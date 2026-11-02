Pod::Spec.new do |s|
  s.name           = 'GruntzMetaEvents'
  s.version        = '1.0.0'
  s.summary        = 'Consent-gated install and app-open measurement for Gruntz'
  s.homepage       = 'https://gruntzfit.com'
  s.license        = { :type => 'Proprietary' }
  s.author         = 'Gruntz'
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'FBSDKCoreKit', '19.0.0'
  s.source_files   = '**/*.swift'
end

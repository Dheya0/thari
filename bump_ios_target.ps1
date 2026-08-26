# DEPRECATED: This script is no longer required and left in the repo for traceability only.
# Do not execute. The iOS deployment target bump is already applied in source control.
# If you need to re-run target bumping use the committed codemagic.yaml and Podfile changes instead.
# (File neutralized to avoid accidental execution)
# Original path line removed intentionally.

# Update Podfile
$podfile = Get-Content 'ios/App/Podfile' -Raw
$podfile = $podfile -replace "platform :ios, '14.0'","platform :ios, '15.0'"
Set-Content 'ios/App/Podfile' $podfile

# Update Xcode project deployment target
$pbx = Get-Content 'ios/App/App.xcodeproj/project.pbxproj' -Raw
$pbx = $pbx -replace 'IPHONEOS_DEPLOYMENT_TARGET = 14.0;','IPHONEOS_DEPLOYMENT_TARGET = 15.0;'
Set-Content 'ios/App/App.xcodeproj/project.pbxproj' $pbx

# Update Codemagic replacement rules
$cm = Get-Content 'codemagic.yaml' -Raw
$cm = $cm -replace "platform :ios, '14.0'","platform :ios, '15.0'"
$cm = $cm -replace 'IPHONEOS_DEPLOYMENT_TARGET = 14.0;','IPHONEOS_DEPLOYMENT_TARGET = 15.0;'
Set-Content 'codemagic.yaml' $cm

# Commit and push
git add ios/App/Podfile ios/App/App.xcodeproj/project.pbxproj codemagic.yaml
try {
    git commit -m "Bump iOS deployment target to 15.0 to satisfy CapacitorStatusBar pod"
} catch {
    Write-Host "No changes to commit"
}

git push origin main

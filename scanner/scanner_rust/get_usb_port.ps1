Get-PnpDevice | Where-Object { $_.FriendlyName -like '*Sony*' -or $_.FriendlyName -like '*FeliCa*' -or $_.FriendlyName -like '*Pasori*' } | ForEach-Object {
    $device = $_
    $locationInfo = (Get-PnpDeviceProperty -InstanceId $device.InstanceId -KeyName 'DEVPKEY_Device_LocationInfo' -ErrorAction SilentlyContinue).Data
    Write-Output "Name: $($device.FriendlyName)"
    Write-Output "InstanceId: $($device.InstanceId)"
    Write-Output "Location: $locationInfo"
    Write-Output "---"
}

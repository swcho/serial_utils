# serial_utils

node js based utilities for sending command and returning parsed result.

# APIs

## Initialization

Initialize with target serial device.

```typescript
export function init(port, cb: (serial_commander) => void)
```

## Logging

### set_show_log

Show log on shell script

```typescript
export function set_show_log(show: boolean)
```

### wait_line

Provide regular expression and callback for parsing and callback continusously.

```typescript
export function wait_line(pattern: RegExp, cb: (match) => void)
```

### wait_linc_once

Provide regular expression and callback for parsing and callback once.

```typescript
export function wait_line_once(pattern: RegExp, cb: (match) => void)
```

## start_capture

Start capture

```typescript
export function start_capture()
```

## stop_capture

Stop capture and save it to the given file name.

```typescript
export function stop_capture(filename: string)
```

## Common Linux commands

Command utilities running on Linux.

### list

list files or directories in a certain directory

```typescript
export function list(aPath: string, aCb: (err, file_info_list: TFileInfo[]) => void)
```

## Android commands

Command utilities running on Android device

### pm_list_features

List device features

```typescript
export function pm_list_features(aCb: (err: any, feature_list: string[]) => void)
```

### pm_list_packages

List packages

```typescript
export function pm_list_packages(aCb: (err: any, result: TPackageInfo[]) => void)
```

### pm_list_instrumentation

List instrumentations

```typescript
export function pm_list_instrumentation(aCb: (err: any, instrumentation_info_list: TInstrumentationInfo[]) => void)
```

### install_apk

Install local copy of apk

```typescript
export function install_apk(aPath: string, aCb: (err: any) => void)
```

### run_test

Run test

```typescript
export function run_test(aPackageName: string, aRunner: string, aCb: (err: any) => void)
```

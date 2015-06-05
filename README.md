# serial_utils

node js based utilities for sending command and return parsed result.

# APIs

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

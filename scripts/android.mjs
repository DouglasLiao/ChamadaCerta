import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile } from 'node:fs/promises';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
const localJdk = path.join(root, '.tools', 'jdk');
if (!env.JAVA_HOME && existsSync(localJdk)) {
  const folder = readdirSync(localJdk).find((name) =>
    existsSync(
      path.join(localJdk, name, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'),
    ),
  );
  if (folder) env.JAVA_HOME = path.join(localJdk, folder);
}
if (
  !env.ANDROID_HOME &&
  !env.ANDROID_SDK_ROOT &&
  existsSync(path.join(root, '.tools', 'android-sdk'))
)
  env.ANDROID_HOME = path.join(root, '.tools', 'android-sdk');
const tasks = process.argv.slice(2);
if (!tasks.length) throw new Error('Informe uma tarefa Gradle.');
if (!tasks.every((task) => /^[a-zA-Z0-9:]+$/.test(task)))
  throw new Error('Tarefa Gradle inválida.');
const child = spawn(
  process.platform === 'win32' ? 'cmd.exe' : 'sh',
  process.platform === 'win32'
    ? ['/d', '/c', 'gradlew.bat', ...tasks, '--console', 'plain']
    : ['./gradlew', ...tasks, '--console', 'plain'],
  { cwd: path.join(root, 'android'), env, windowsHide: true, stdio: 'inherit' },
);
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', async (code) => {
  process.exitCode = code ?? 1;
  if (code === 0 && tasks.includes('assembleDebug')) {
    try {
      const artifacts = path.join(root, 'artifacts');
      await mkdir(artifacts, { recursive: true });
      await copyFile(
        path.join(root, 'android/app/build/outputs/apk/debug/app-debug.apk'),
        path.join(artifacts, 'ChamadaCerta-debug.apk'),
      );
      console.log('APK disponível em artifacts/ChamadaCerta-debug.apk');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
});

#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// 读取package.json
async function readPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const content = await fs.readFile(packagePath, 'utf8');
  return JSON.parse(content);
}

// 写入package.json
async function writePackageJson(packageData) {
  const packagePath = path.join(process.cwd(), 'package.json');
  await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2) + '\n');
}

// 增加版本号
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1] += 1;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2] += 1;
      break;
  }
  
  return parts.join('.');
}

// 主函数
async function main() {
  try {
    // 获取命令行参数
    const args = process.argv.slice(2);
    const versionType = args[0] || 'patch'; // 默认为patch版本
    
    if (!['major', 'minor', 'patch'].includes(versionType)) {
      console.error('错误: 版本类型必须是 major, minor 或 patch');
      process.exit(1);
    }
    
    // 读取当前package.json
    const packageData = await readPackageJson();
    const currentVersion = packageData.version;
    
    console.log(`当前版本: ${currentVersion}`);
    
    // 增加版本号
    const newVersion = incrementVersion(currentVersion, versionType);
    packageData.version = newVersion;
    
    // 写入新的package.json
    await writePackageJson(packageData);
    
    console.log(`新版本: ${newVersion}`);
    
    // 执行git提交和标签
    try {
      console.log('创建git提交...');
      execSync(`git add package.json`, { stdio: 'inherit' });
      execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
      
      console.log('创建git标签...');
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
      
      console.log('推送到远程仓库...');
      execSync(`git push`, { stdio: 'inherit' });
      execSync(`git push --tags`, { stdio: 'inherit' });
      
      console.log(`✅ 版本 ${newVersion} 发布成功!`);
    } catch (gitError) {
      console.warn('Git操作失败，但版本号已更新:', gitError.message);
      console.log(`✅ 版本号已更新为 ${newVersion}`);
    }
    
  } catch (error) {
    console.error('发布失败:', error.message);
    process.exit(1);
  }
}

main();
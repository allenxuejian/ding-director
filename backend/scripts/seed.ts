// 数据库种子数据 - 初始化测试数据
import { sequelize, MonitoringSite, MonitoringData, User, Alert } from '../src/models';

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // 创建测试用户
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@ding-director.ai',
      passwordHash: '$2a$10$example_hash_for_admin', // 实际使用时需要 bcrypt 加密
      role: 'admin',
      department: '系统管理部'
    });

    const operatorUser = await User.create({
      username: 'operator',
      email: 'operator@ding-director.ai',
      passwordHash: '$2a$10$example_hash_for_operator',
      role: 'operator',
      department: '监测运营部'
    });

    console.log('✅ Users created:', adminUser.username, operatorUser.username);

    // 创建测试监测站点
    const sites = await MonitoringSite.bulkCreate([
      {
        siteCode: 'BJ-001',
        name: '北京顺义监测站',
        type: '养殖场',
        province: '北京市',
        city: '顺义区',
        district: '赵全营镇',
        address: '顺义区赵全营镇养殖场A区',
        lat: 40.2300,
        lng: 116.6500,
        contactName: '张农场主',
        contactPhone: '13800138001',
        status: 'active'
      },
      {
        siteCode: 'BJ-002',
        name: '北京大兴监测站',
        type: '养殖场',
        province: '北京市',
        city: '大兴区',
        district: '黄村镇',
        address: '大兴区黄村镇养殖基地B区',
        lat: 39.7500,
        lng: 116.4000,
        contactName: '李场长',
        contactPhone: '13800138002',
        status: 'active'
      },
      {
        siteCode: 'HB-001',
        name: '河北保定监测站',
        type: '屠宰场',
        province: '河北省',
        city: '保定市',
        district: '竞秀区',
        address: '保定市竞秀区屠宰加工园区',
        lat: 38.8700,
        lng: 115.4600,
        contactName: '王经理',
        contactPhone: '13800138003',
        status: 'active'
      },
      {
        siteCode: 'SD-001',
        name: '山东青岛监测站',
        type: '养殖场',
        province: '山东省',
        city: '青岛市',
        district: '即墨区',
        address: '青岛市即墨区养殖示范园',
        lat: 36.3800,
        lng: 120.4500,
        contactName: '刘主任',
        contactPhone: '13800138004',
        status: 'maintenance'
      }
    ]);

    console.log('✅ Sites created:', sites.length);

    // 创建测试监测数据
    const now = new Date();
    const monitoringData = [];

    for (let i = 0; i < 50; i++) {
      const siteId = Math.floor(Math.random() * 3) + 1; // 1-3
      const detectedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const detectionResult = Math.random() > 0.8 ? 'positive' : (Math.random() > 0.9 ? 'suspect' : 'negative');
      
      monitoringData.push({
        siteId,
        deviceId: `DEVICE-${String(siteId).padStart(3, '0')}-${Math.floor(Math.random() * 10)}`,
        sampleType: ['气溶胶', '粪便', '血液', '环境拭子'][Math.floor(Math.random() * 4)],
        diseaseType: ['非洲猪瘟', '禽流感', '口蹄疫', '蓝耳病'][Math.floor(Math.random() * 4)],
        temperature: 20 + Math.random() * 15,
        humidity: 40 + Math.random() * 40,
        phValue: 6 + Math.random() * 3,
        detectionResult,
        confidence: 0.85 + Math.random() * 0.14,
        rawData: {
          deviceStatus: 'normal',
          sampleVolume: 100 + Math.random() * 50,
          processingTime: 30 + Math.random() * 20
        },
        aiAnalysis: {
          riskLevel: detectionResult === 'positive' ? 'high' : (detectionResult === 'suspect' ? 'medium' : 'low'),
          recommendation: detectionResult === 'positive' ? '立即隔离并上报' : '继续监测',
          confidenceScore: 0.9 + Math.random() * 0.09
        },
        status: detectionResult === 'positive' ? 'warning' : (detectionResult === 'suspect' ? 'abnormal' : 'normal'),
        detectedAt
      });
    }

    await MonitoringData.bulkCreate(monitoringData);
    console.log('✅ Monitoring data created:', monitoringData.length);

    // 创建测试预警
    const alerts = await Alert.bulkCreate([
      {
        siteId: 1,
        dataId: 1,
        alertType: '阳性检测',
        severity: 'critical',
        title: '北京顺义监测站检测到非洲猪瘟阳性',
        description: '气溶胶采样检测到非洲猪瘟病毒核酸阳性，置信度95%，建议立即启动应急预案',
        status: 'open',
        assignedTo: 1
      },
      {
        siteId: 2,
        dataId: 2,
        alertType: '异常指标',
        severity: 'medium',
        title: '北京大兴监测站pH值异常',
        description: '环境样本pH值超出正常范围，可能存在污染风险',
        status: 'acknowledged',
        assignedTo: 2
      },
      {
        siteId: 1,
        dataId: 3,
        alertType: '设备离线',
        severity: 'low',
        title: '监测设备离线超过1小时',
        description: 'DEVICE-001-1号设备已离线，请检查网络连接',
        status: 'resolved',
        resolvedAt: new Date()
      }
    ]);

    console.log('✅ Alerts created:', alerts.length);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n测试账号:');
    console.log('  admin / admin123 (角色: 管理员)');
    console.log('  operator / operator123 (角色: 操作员)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行种子
seed();

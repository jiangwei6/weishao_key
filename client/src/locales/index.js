export const messages = {
  zh: {
    login: {
      title: '威少激活',
      username: '用户名',
      password: '密码',
      loginButton: '登录',
      usernamePlaceholder: '请输入用户名',
      passwordPlaceholder: '请输入密码',
      loginSuccess: '登录成功',
      loginFailed: '登录失败'
    },
    common: {
      contact: {
        title: '联系',
        contactPerson: '联系人：威少',
        wechat: '微信：jiang-wei'
      },
      logout: {
        title: '退出登录',
        confirm: '确认退出登录？',
        confirmButton: '确认',
        cancelButton: '取消'
      },
      operation: {
        copy: '复制',
        delete: '删除',
        edit: '编辑',
        refresh: '刷新',
        export: '导出',
        save: '保存',
        cancel: '取消',
        confirm: '确认',
        search: '搜索',
        add: '添加',
        modify: '修改',
        success: '成功',
        failed: '失败',
        loading: '加载中...'
      }
    },
    menu: {
      generateKey: '生成Key',
      keyList: 'Key列表',
      apiDocs: 'API文档',
      settings: '设置',
      userManagement: '用户管理'
    },
    keyList: {
      title: 'Key列表',
      totalCount: '总数量',
      activeCount: '已激活',
      inactiveCount: '未激活',
      key: 'Key',
      duration: '时间标记',
      status: '状态',
      createdAt: '生成时间',
      note: '备注',
      action: '操作',
      batchCopy: '批量复制',
      batchDelete: '批量删除',
      searchPlaceholder: '搜索备注',
      exportExcel: '导出Excel',
      exportCSV: '导出CSV',
      confirmDelete: '确定要删除选中项吗？',
      days: '天',
      active: '已激活',
      inactive: '未激活'
    },
    settings: {
      title: '设置',
      keyGeneration: {
        title: 'Key生成设置',
        seed: 'Key生成种子',
        seedPlaceholder: '请输入种子值',
        seedHelp: '用于生成唯一Key的种子值，修改后会影响新生成的Key',
        prefix: 'Key前缀',
        prefixPlaceholder: '请输入Key前缀',
        prefixHelp: '生成的Key会带有此前缀（可选）',
        saveButton: '保存设置'
      },
      password: {
        title: '修改密码',
        oldPassword: '原密码',
        oldPasswordPlaceholder: '请输入原密码',
        newPassword: '新密码',
        newPasswordPlaceholder: '请输入新密码',
        changeButton: '修改密码',
        guestWarning: 'Guest账户不能修改密码',
        success: '密码修改成功，请重新登录'
      },
      language: {
        title: '语言设置',
        help: '切换界面语言'
      }
    },
    apiDocs: {
      title: 'API文档',
      endpoint: '接口地址',
      headers: '请求头',
      requestExample: '请求示例',
      responseExample: '响应示例',
      responseDesc: '响应说明',
      yourToken: '您的API Token',
      noToken: '暂无Token',
      loading: '加载中...',
      copy: '复制',
      copySuccess: '复制成功',
      copyFailed: '复制失败',
      tips: {
        title: '使用说明',
        content: [
          '1. 请在请求头中添加 Authorization Bearer Token',
          '2. Key 验证成功后将被标记为已使用',
          '3. 同一个 Key 只能使用一次',
          '4. 可以在备注中添加激活信息'
        ]
      }
    },
    userManagement: {
      title: '用户管理',
      addUser: '添加用户',
      editUser: '编辑用户',
      username: '用户名',
      password: '密码',
      role: '角色',
      status: '状态',
      createdAt: '创建时间',
      apiToken: 'API Token',
      action: '操作',
      roles: {
        admin: '管理员',
        user: '普通用户',
        guest: '访客'
      },
      status: {
        normal: '正常',
        locked: '已锁定'
      },
      actions: {
        edit: '编辑',
        delete: '删除',
        unlock: '解锁',
        changePassword: '修改密码'
      },
      confirmDelete: '确定要删除此用户吗？',
      copyToken: '复制Token',
      tokenCopied: 'Token已复制'
    },
    generateKey: {
      title: '生成Key',
      duration: '有效期',
      quantity: '生成数量',
      note: '备注',
      durationPlaceholder: '请选择有效期',
      quantityPlaceholder: '请输入生成数量',
      notePlaceholder: '请输入备注（可选）',
      generateButton: '生成Key',
      durationOptions: {
        '30': '30天',
        '90': '90天',
        '365': '365天'
      },
      success: '生成成功',
      failed: '生成失败',
      configFirst: '请先在设置中配置Key生成规则',
      quantityLimit: '数量范围：1-100'
    }
  },
  en: {
    login: {
      title: 'WeishaoKey',
      username: 'Username',
      password: 'Password',
      loginButton: 'Login',
      usernamePlaceholder: 'Please input username',
      passwordPlaceholder: 'Please input password',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed'
    },
    common: {
      contact: {
        title: 'Contact',
        contactPerson: 'Contact: WeiShao',
        wechat: 'WeChat: jiang-wei'
      },
      logout: {
        title: 'Logout',
        confirm: 'Confirm logout?',
        confirmButton: 'Confirm',
        cancelButton: 'Cancel'
      },
      operation: {
        copy: 'Copy',
        delete: 'Delete',
        edit: 'Edit',
        refresh: 'Refresh',
        export: 'Export',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        search: 'Search',
        add: 'Add',
        modify: 'Modify',
        success: 'Success',
        failed: 'Failed',
        loading: 'Loading...'
      }
    },
    menu: {
      generateKey: 'Generate Key',
      keyList: 'Key List',
      apiDocs: 'API Docs',
      settings: 'Settings',
      userManagement: 'User Management'
    },
    keyList: {
      title: 'Key List',
      totalCount: 'Total',
      activeCount: 'Active',
      inactiveCount: 'Inactive',
      key: 'Key',
      duration: 'Time Mark',
      status: 'Status',
      createdAt: 'Created At',
      note: 'Note',
      action: 'Action',
      batchCopy: 'Batch Copy',
      batchDelete: 'Batch Delete',
      searchPlaceholder: 'Search note',
      exportExcel: 'Export Excel',
      exportCSV: 'Export CSV',
      confirmDelete: 'Confirm delete selected items?',
      days: 'days',
      active: 'Active',
      inactive: 'Inactive'
    },
    settings: {
      title: 'Settings',
      keyGeneration: {
        title: 'Key Generation Settings',
        seed: 'Key Generation Seed',
        seedPlaceholder: 'Please input seed value',
        seedHelp: 'Used to generate unique keys, changes will affect newly generated keys',
        prefix: 'Key Prefix',
        prefixPlaceholder: 'Please input key prefix',
        prefixHelp: 'Generated keys will have this prefix (optional)',
        saveButton: 'Save Settings'
      },
      password: {
        title: 'Change Password',
        oldPassword: 'Old Password',
        oldPasswordPlaceholder: 'Please input old password',
        newPassword: 'New Password',
        newPasswordPlaceholder: 'Please input new password',
        changeButton: 'Change Password',
        guestWarning: 'Guest account cannot change password',
        success: 'Password changed successfully, please login again'
      },
      language: {
        title: 'Language',
        help: 'Switch interface language'
      }
    },
    apiDocs: {
      title: 'API Documentation',
      endpoint: 'Endpoint',
      headers: 'Headers',
      requestExample: 'Request Example',
      responseExample: 'Response Example',
      responseDesc: 'Response Description',
      yourToken: 'Your API Token',
      noToken: 'No Token',
      loading: 'Loading...',
      copy: 'Copy',
      copySuccess: 'Copied',
      copyFailed: 'Copy failed',
      tips: {
        title: 'Instructions',
        content: [
          '1. Add Authorization Bearer Token in request headers',
          '2. Key will be marked as used after successful verification',
          '3. Each key can only be used once',
          '4. You can add activation information in the note'
        ]
      }
    },
    userManagement: {
      title: 'User Management',
      addUser: 'Add User',
      editUser: 'Edit User',
      username: 'Username',
      password: 'Password',
      role: 'Role',
      status: 'Status',
      createdAt: 'Created At',
      apiToken: 'API Token',
      action: 'Action',
      roles: {
        admin: 'Administrator',
        user: 'User',
        guest: 'Guest'
      },
      status: {
        normal: 'Normal',
        locked: 'Locked'
      },
      actions: {
        edit: 'Edit',
        delete: 'Delete',
        unlock: 'Unlock',
        changePassword: 'Change Password'
      },
      confirmDelete: 'Are you sure to delete this user?',
      copyToken: 'Copy Token',
      tokenCopied: 'Token copied'
    },
    generateKey: {
      title: 'Generate Key',
      duration: 'Duration',
      quantity: 'Quantity',
      note: 'Note',
      durationPlaceholder: 'Select duration',
      quantityPlaceholder: 'Input quantity',
      notePlaceholder: 'Input note (optional)',
      generateButton: 'Generate',
      durationOptions: {
        '30': '30 days',
        '90': '90 days',
        '365': '365 days'
      },
      success: 'Generated successfully',
      failed: 'Generation failed',
      configFirst: 'Please configure key generation rules in settings first',
      quantityLimit: 'Quantity range: 1-100'
    }
  }
}; 
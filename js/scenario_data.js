const scenarios = [
  // フリーモード（判定なし、自由に操作）
  {
    id: "free",
    title: "フリー練習モード",
    description: "自由にコマンドを操作できます。判定はありません。",
    devices: [
      { name: "Switch", type: "switch" },
      { name: "Router", type: "router" }
    ],
    tasks: []
  },
// -------------------------------------------------------------
  // Question 1: VLANとLLDPの設定 (Safe Path版)
  // -------------------------------------------------------------
  {
    id: "question1",
    title: "Question 1",
    image: "img/question1.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>新しいオフィスネットワークのセットアップを行っています。トポロジー図に従ってVLANを作成し、適切なポートに割り当て、業界標準の近隣探索プロトコルを設定する必要があります。</p>
      </div>
    `,
    tasks: [
      "1. SW-1 を VLAN 35 に設定し、SALES というラベルを付けます",
      "2. SW-2 を VLAN 39 に設定し、MARKETING というラベルを付けます",
      "3. PC1 に接続するスイッチポート(Ethernet0/2) を設定します",
      "4. PC2 に接続するスイッチポート(Ethernet0/3) を設定します",
      "5. 業界標準プロトコル(LLDP)を使用して、SW-1とSW-2をユニバーサルネイバーディスカバリに設定し、PC1に接続するインターフェース(Ethernet0/2)で無効にします。"
    ],
    devices: [
      { name: "SW-1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"] },
      { name: "SW-2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"] }
    ],
    validations: [
      // --- SW-1 VLAN設定 ---
      {
        device: "SW-1",
        path: "runningConfig", // 常に存在するパスを指定してエラー回避
        condition: (config) => config && config.vlans && config.vlans['35'],
        message: "SW-1: VLAN 35 が作成されていません"
      },
      {
        device: "SW-1",
        path: "runningConfig",
        condition: (config) => config && config.vlans && config.vlans['35'] && config.vlans['35'].name === 'SALES',
        message: "SW-1: VLAN 35 の名前が SALES ではありません"
      },
      
      // --- SW-2 VLAN設定 ---
      {
        device: "SW-2",
        path: "runningConfig",
        condition: (config) => config && config.vlans && config.vlans['39'],
        message: "SW-2: VLAN 39 が作成されていません"
      },
      {
        device: "SW-2",
        path: "runningConfig",
        condition: (config) => config && config.vlans && config.vlans['39'] && config.vlans['39'].name === 'MARKETING',
        message: "SW-2: VLAN 39 の名前が MARKETING ではありません"
      },

      // --- SW-1 ポート設定 (PC1 -> e0/2) ---
      {
        device: "SW-1",
        path: "runningConfig",
        condition: (config) => {
            const port = config && config.interfaces && config.interfaces['Ethernet0/2'];
            return port && port.switchport && port.switchport.access_vlan === '35';
        },
        message: "SW-1: Ethernet0/2 (PC1接続ポート) が VLAN 35 に割り当てられていません"
      },

      // --- SW-2 ポート設定 (PC2 -> e0/3) ---
      {
        device: "SW-2",
        path: "runningConfig",
        condition: (config) => {
            const port = config && config.interfaces && config.interfaces['Ethernet0/2'];
            return port && port.switchport && port.switchport.access_vlan === '39';
        },
        message: "SW-2: Ethernet0/2 (PC2接続ポート) が VLAN 39 に割り当てられていません"
      },

      // --- LLDP Global 設定 ---
      {
        device: "SW-1",
        path: "runningConfig",
        condition: (config) => config && config.lldp && config.lldp.enabled === true,
        message: "SW-1: LLDPがグローバルで有効になっていません (lldp run)"
      },
      {
        device: "SW-2",
        path: "runningConfig",
        condition: (config) => config && config.lldp && config.lldp.enabled === true,
        message: "SW-2: LLDPがグローバルで有効になっていません (lldp run)"
      },

      // --- LLDP Interface 設定 (SW-1 e0/2 無効化) ---
      {
        device: "SW-1",
        path: "runningConfig",
        condition: (config) => {
            // LLDP設定自体がない場合、またはインターフェース設定がない場合は判定処理をスキップ(不合格)
            const iface = config && config.lldp && config.lldp.interfaces && config.lldp.interfaces['Ethernet0/2'];
            // 設定が存在し、かつ transmit/receive が false であること
            return iface && iface.transmit === false && iface.receive === false;
        },
        message: "SW-1: Ethernet0/2 で LLDP の送受信が停止されていません (no lldp transmit / no lldp receive)"
      }
    ]
  },

// -------------------------------------------------------------
  // Question 2: セキュリティ設定 (Algorithm Check対応版)
  // -------------------------------------------------------------
  {
    id: "question2",
    title: "Question 2",
    image: "img/question2.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>ネットワークセキュリティを強化するため、ACLによるトラフィック制御、強力な暗号化を用いたユーザー認証、およびDHCPスヌーピングを設定してください。詳細は[Tasks]タブを確認してください。</p>
      </div>
    `,
    tasks: [
      `タスク1.最小限のACE数を使用して拡張名前付きACLを設定し、トポロジ内に配置して、可能な限り多くのリソースを節約します。ACLの要件は次のとおりです。
+ ACL名 = WWW_ACL
+ VLAN 202からのHTTPトラフィックのみを許可
+ PC1のTelnetのみをブロック
+ その他すべてのトラフィックを許可`,
      "タスク2: Sw2 に、仮想ポート0～4のみでTelnetアクセスを許可するローカルアカウントを設定してください。(ユーザー名: AdminGroup, パスワード: BumBL3d, アルゴリズム: Scrypt, 特権レベル: 15)",
      "タスク3: Sw3 で VLAN 102および202のDHCPスヌーピングを有効にし、さらにMACアドレス検証(verify mac-address)も有効にしてください。"
    ],
    devices: [
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "Sw1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "Sw2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "Sw3", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2"] }
    ],
    validations: [
      // --- タスク1: ACL設定 (R1) ---
      { 
        device: "R1", 
        path: "runningConfig.acls.WWW_ACL.type", 
        expected: "extended", 
        message: "R1: 拡張ACL 'WWW_ACL' が作成されていません" 
      },
      // ACEs
      {
        device: "R1",
        path: "runningConfig.acls.WWW_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'permit' && e.raw === 'tcp 10.101.1.0 0.0.0.255 any eq 80'),
        message: "R1: ルール 'permit tcp 10.101.1.0 0.0.0.255 any eq 80' が設定されていません"
      },
      {
        device: "R1",
        path: "runningConfig.acls.WWW_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'deny' && e.raw === 'tcp any any eq 80'),
        message: "R1: ルール 'deny tcp any any eq 80' が設定されていません"
      },
      {
        device: "R1",
        path: "runningConfig.acls.WWW_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'deny' && e.raw === 'tcp host 10.101.0.2 any eq 23'),
        message: "R1: ルール 'deny tcp host 10.101.0.2 any eq 23' が設定されていません"
      },
      {
        device: "R1",
        path: "runningConfig.acls.WWW_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'permit' && e.raw === 'ip any any'),
        message: "R1: ルール 'permit ip any any' が設定されていません"
      },
      // Apply
      { 
        device: "R1", 
        path: "runningConfig.interfaces.Ethernet0/1.accessGroup.in", 
        expected: "WWW_ACL", 
        message: "R1: Ethernet0/1 のインバウンド方向に ACL 'WWW_ACL' が適用されていません" 
      },

      // --- タスク2: ユーザー設定 (Sw2) ---
      { 
        device: "Sw2", 
        path: "runningConfig.security.users.AdminGroup.privilege", 
        expected: 15, 
        message: "Sw2: ユーザー AdminGroup の特権レベルが 15 ではありません" 
      },
      { 
        device: "Sw2", 
        path: "runningConfig.security.users.AdminGroup.password", 
        expected: "BumBL3d", 
        message: "Sw2: ユーザー AdminGroup のパスワードが正しくありません" 
      },
      { 
        device: "Sw2", 
        path: "runningConfig.security.users.AdminGroup.algorithm", 
        expected: "scrypt", 
        message: "Sw2: ユーザー AdminGroup のアルゴリズムが Scrypt (algorithm-type scrypt) ではありません" 
      },
      // VTY
      { 
        device: "Sw2", 
        path: "runningConfig.lines.vty 0 4.transport.input", 
        expected: ["telnet"], 
        message: "Sw2: VTY 0-4 の入力制限が telnet のみになっていません" 
      },
      { 
        device: "Sw2", 
        path: "runningConfig.lines.vty 0 4.loginMethod", 
        expected: "local", 
        message: "Sw2: VTY 0-4 で login local が設定されていません" 
      },

      // --- タスク3: DHCP Snooping (Sw3) ---
      { 
        device: "Sw3", 
        path: "runningConfig.dhcpSnooping.enabled", 
        expected: true, 
        message: "Sw3: DHCPスヌーピングがグローバルで有効になっていません" 
      },
      { 
        device: "Sw3", 
        path: "runningConfig.dhcpSnooping.vlans", 
        match: "containsAll", 
        expected: ["102", "202"], 
        message: "Sw3: VLAN 102, 202 で DHCPスヌーピングが有効になっていません" 
      },
      { 
        device: "Sw3", 
        path: "runningConfig.dhcpSnooping.verifyMac", 
        expected: true, 
        message: "Sw3: DHCPスヌーピングの MACアドレス検証が有効になっていません" 
      }
    ]
  },

// -------------------------------------------------------------
  // Question 3: スタティックルーティング (R2, R4追加版)
  // -------------------------------------------------------------
  {
    id: "question3",
    title: "Question 3",
    image: "img/question3.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>ルーター R1 と R3 において、要件に従ってスタティックルートおよびデフォルトルートを設定してください。詳細は[Tasks]タブを確認してください。</p>
      </div>
    `,
    tasks: [
      "R1がR4のLAN上のPC1のみに到達する際、R2経由の経路を優先するよう静的ルーティングを設定する",
      "プライマリ経路に障害が発生した場合、R1発のトラフィックがR3経由の代替経路でPC1に到達するよう静的ルーティングを設定する",
      "R1とR3に、最小ホップ数でインターネットへ接続するデフォルトルートを設定する"
    ],
    devices: [
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R2", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R3", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R4", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      // タスク1: R1 -> 10.0.41.10/32 via 10.0.12.2
      {
        device: "R1",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "10.0.41.10", mask: "255.255.255.255", nextHop: "10.0.12.2" },
        message: "R1: PC1への優先経路 (via 10.0.12.2) が設定されていません"
      },
      // タスク2: R1 -> 10.0.41.10/32 via 10.0.13.3 AD 2
      {
        device: "R1",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "10.0.41.10", mask: "255.255.255.255", nextHop: "10.0.13.3", distance: 2 },
        message: "R1: PC1への代替経路 (via 10.0.13.3, AD 2) が設定されていません"
      },
      // タスク3 (R1): Default Route via 10.0.13.3
      {
        device: "R1",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "0.0.0.0", mask: "0.0.0.0", nextHop: "10.0.13.3" },
        message: "R1: デフォルトルート (via 10.0.13.3) が設定されていません"
      },
      // タスク3 (R3): Default Route via 209.165.201.1
      {
        device: "R3",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "0.0.0.0", mask: "0.0.0.0", nextHop: "209.165.201.1" },
        message: "R3: デフォルトルート (via 209.165.201.1) が設定されていません"
      }
    ]
  },

// -------------------------------------------------------------
  // Question 4: IPサービス設定 (R1, R3追加版)
  // -------------------------------------------------------------
  {
    id: "question4",
    title: "Question 4",
    image: "img/question4.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>デバイス間の接続は確立されており、実装を完了するにはIPサービスを設定する必要があります。ルータR2にはNATとDHCPの部分的な設定が施されています。</p>
      </div>
    `,
    tasks: [
      `タスク1
ルータR2はIPアドレス10.0.12.1に対してポートアドレス変換（PAT）が部分的に設定されています。
+ PATを設定し、10.0.12.1がEthernet0/0のIPアドレスをパブリックルーティング可能IPとして使用するようにする。
+ SW1から209.165.200.224へのpingを使用して、R2での変換が成功していることを確認する。`,
      
      `タスク2
R2に設定されたNTPサーバーを使用して、SW1にNTPクライアントを設定する。
– ntp broadcast client または ntp broadcast コマンドは使用しないこと。`,
      
      `タスク 3
– SW1にDHCPリレーエージェントを設定する。`,
      
      `タスク 4
SW1のVTYライン0から4にSSHサーバーを設定する。
– SSHバージョン2を使用する`
    ],
    devices: [
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R2", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R3", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "SW-1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      // --- タスク1: R2 PAT設定 ---
      {
        device: "R2",
        path: "runningConfig.nat.insideSourceList",
        expected: "1",
        message: "R2: NATのソースリストが 1 ではありません"
      },
      {
        device: "R2",
        path: "runningConfig.nat.interfaceOverload",
        expected: "Ethernet0/0",
        message: "R2: NATのオーバーロードインターフェースが Ethernet0/0 ではありません"
      },

      // --- タスク2: SW1 NTP設定 ---
      {
        device: "SW-1",
        path: "runningConfig.ntp.server",
        expected: "10.0.12.2",
        message: "SW-1: NTPサーバーが 10.0.12.2 に設定されていません"
      },

      // --- タスク3: SW1 DHCPリレー設定 ---
      {
        device: "SW-1",
        path: "runningConfig.interfaces.Vlan101.ipHelper",
        expected: "10.0.12.2",
        message: "SW-1: VLAN 101 に helper-address 10.0.12.2 が設定されていません"
      },

      // --- タスク4: SW1 SSH設定 ---
      {
        device: "SW-1",
        path: "runningConfig.security.sshVersion",
        expected: 2,
        message: "SW-1: SSHのバージョンが 2 に設定されていません"
      },
      {
        device: "SW-1",
        path: "runningConfig.lines.vty 0 4.transport.input",
        expected: ["ssh"],
        message: "SW-1: VTY 0-4 の入力制限が ssh ではありません"
      },
      {
        device: "SW-1",
        path: "runningConfig.lines.vty 0 4.loginMethod",
        expected: "local",
        message: "SW-1: VTY 0-4 で login local が設定されていません"
      }
    ]
  },

// -------------------------------------------------------------
  // Question 5: スタティックルーティング (障害試験判定付き)
  // -------------------------------------------------------------
  {
    id: "question5",
    title: "Question 5",
    image: "img/question5.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>複雑なネットワーク環境において、以下のルーティング要件に従って各ルーターを設定し、接続性を確認してください。詳細は[Tasks]タブを確認してください。</p>
      </div>
    `,
    tasks: [
      `タスク1
+ R5 に宛先 10.200.220.6 へのホストルートを設定する。
+ R1に静的デフォルトルートを設定し、R3経由でR6に向かう経路を優先させる。
+ R5からtracerouteとpingを使用し、R6への経路と到達可能性を確認する。`,

      `タスク2
+ R1にフローティング静的デフォルトルートを設定し、R3へのリンクが障害発生時にR2経由でR6に向かう経路を優先させる。
+ 225の管理距離を設定する。
+ R2に静的ルートを設定し、10.100.110.0/25への返信トラフィックを転送する。
+ R1のインターフェースe0/1をシャットダウン後、R5からtracerouteとpingを使用してR6への経路と到達可能性を確認する。`
    ],
    devices: [
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2"] },
      { name: "R2", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R5", type: "router", physicalPorts: ["Ethernet0/0"] }
    ],
    validations: [
      // --- タスク1: 基本ルーティング設定 ---
      // R5: ip route 10.200.220.6 ...
      {
        device: "R5",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "10.200.220.6", mask: "255.255.255.255", nextHop: "10.100.110.1" },
        message: "R5: 宛先 10.200.220.6 へのホストルートが正しく設定されていません"
      },
      // R1: Default Route via R3 (10.133.13.3)
      {
        device: "R1",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "0.0.0.0", mask: "0.0.0.0", nextHop: "10.133.13.3" },
        message: "R1: R3経由(10.133.13.3)のデフォルトルートが設定されていません"
      },

      // --- タスク2: 冗長化設定 ---
      // R2: Return Route
      {
        device: "R2",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "10.100.110.0", mask: "255.255.255.128", nextHop: "10.122.12.1" },
        message: "R2: 10.100.110.0/25 への返信ルートが設定されていません"
      },
      // R1: Floating Static Route via R2 (AD 225)
      {
        device: "R1",
        path: "runningConfig.routing.staticRoutes",
        match: "contains",
        expected: { destination: "0.0.0.0", mask: "0.0.0.0", nextHop: "10.122.12.2", distance: 225 },
        message: "R1: R2経由(10.122.12.2)のフローティングスタティックルート(AD 225)が設定されていません"
      },

      // --- タスク2: 障害試験と確認 ---
      // 1. R1のインターフェースシャットダウン確認
      {
        device: "R1",
        path: "runningConfig.interfaces.Ethernet0/1.status",
        expected: "shutdown",
        message: "R1: テストのためにインターフェース Ethernet0/1 をシャットダウンしていません"
      },
      // 2. R5からのPing実行確認 (10.200.220.6宛て)
      {
        device: "R5",
        path: "runningConfig.logs",
        condition: (logs) => logs && logs.some(l => l.command === 'ping' && l.target === '10.200.220.6'),
        message: "R5: R6 (10.200.220.6) への Ping による到達確認が行われていません"
      },
      // 3. R5からのTraceroute実行確認 (10.200.220.6宛て)
      {
        device: "R5",
        path: "runningConfig.logs",
        condition: (logs) => logs && logs.some(l => l.command === 'traceroute' && l.target === '10.200.220.6'),
        message: "R5: R6 (10.200.220.6) への Traceroute による経路確認が行われていません"
      }
    ]
  },

// -------------------------------------------------------------
  // Question 6: セキュリティ設定 (ユーザー, NACL, PortSecurity)
  // -------------------------------------------------------------
  {
    id: "question6",
    title: "Question 6",
    image: "img/question6.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>トポロジーを参照してください。すべての物理ケーブル配線は完了しています。ローカルユーザーアカウント、名前付きアクセス制御リスト（NACL）、およびセキュリティを設定してください。</p>
      </div>
    `,
    tasks: [
      `タスク1. Sw101 にローカルアカウントを設定し、仮想ポート 0-4 でのみ telnet アクセスを許可する。
以下の情報を使用する：
+ ユーザー名: support
+ パスワード: max2learn
+ 特権レベル: Exec モード`,

      `タスク2. Sw101 に単一の NACL を設定し適用する。以下の内容を使用する：
+ 名前: ENT_ACL
+ VLAN 200上のPC2からPC1へpingを拒否する
+ VLAN 200上のPC2のみがSw101へtelnet接続できるように許可
+ VLAN 200からのその他すべてのデバイスによるtelnet接続を禁止
+ VLAN 200からのその他すべてのネットワークトラフィックを許可`,

      `タスク3. Sw102のインターフェイスEthernet 0/0にセキュリティを設定:
+ セキュアMACアドレスの最大数を4に設定する。
+ セキュアMACアドレス数が設定最大値を下回るまで、送信元アドレス不明のパケットを破棄する。通知アクションは不要。
+ セキュアMACアドレスの動的学習を許可する。`
    ],
    devices: [
      { name: "Sw101", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "Sw102", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      // --- タスク1: Sw101 User & VTY ---
      // username support privilege 15 secret max2learn
      {
        device: "Sw101",
        path: "runningConfig.security.users.support.privilege",
        expected: 15,
        message: "Sw101: ユーザー support の特権レベルが 15 (Exec) ではありません"
      },
      {
        device: "Sw101",
        path: "runningConfig.security.users.support.password",
        expected: "max2learn",
        message: "Sw101: ユーザー support のパスワードが正しくありません"
      },
      // line vty 0 4 -> transport input telnet
      {
        device: "Sw101",
        path: "runningConfig.lines.vty 0 4.transport.input",
        expected: ["telnet"],
        message: "Sw101: VTY 0-4 の入力制限が telnet のみになっていません"
      },
      // login local
      {
        device: "Sw101",
        path: "runningConfig.lines.vty 0 4.loginMethod",
        expected: "local",
        message: "Sw101: VTY 0-4 でローカル認証 (login local) が設定されていません"
      },

      // --- タスク2: Sw101 NACL (ENT_ACL) ---
      // ip access-list extended ENT_ACL
      {
        device: "Sw101",
        path: "runningConfig.acls.ENT_ACL.type",
        expected: "extended",
        message: "Sw101: 拡張ACL 'ENT_ACL' が作成されていません"
      },
      // deny icmp host 192.168.200.10 host 192.168.100.10
      {
        device: "Sw101",
        path: "runningConfig.acls.ENT_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'deny' && e.raw === 'icmp host 192.168.200.10 host 192.168.100.10'),
        message: "Sw101: ルール 'deny icmp host 192.168.200.10 host 192.168.100.10' が設定されていません"
      },
      // permit tcp host 192.168.200.10 host 192.168.100.1 eq telnet
      {
        device: "Sw101",
        path: "runningConfig.acls.ENT_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'permit' && e.raw === 'tcp host 192.168.200.10 host 192.168.100.1 eq telnet'),
        message: "Sw101: ルール 'permit tcp host 192.168.200.10 host 192.168.100.1 eq telnet' が設定されていません"
      },
      // deny tcp 192.168.200.0 0.0.0.255 any eq telnet
      {
        device: "Sw101",
        path: "runningConfig.acls.ENT_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'deny' && e.raw === 'tcp 192.168.200.0 0.0.0.255 any eq telnet'),
        message: "Sw101: ルール 'deny tcp 192.168.200.0 0.0.0.255 any eq telnet' が設定されていません"
      },
      // permit ip 192.168.200.0 0.0.0.255 any
      {
        device: "Sw101",
        path: "runningConfig.acls.ENT_ACL.entries",
        condition: (entries) => entries && entries.some(e => e.action === 'permit' && e.raw === 'ip 192.168.200.0 0.0.0.255 any'),
        message: "Sw101: ルール 'permit ip 192.168.200.0 0.0.0.255 any' が設定されていません"
      },
      // Apply: int vlan 100 -> ip access-group ENT_ACL out
      {
        device: "Sw101",
        path: "runningConfig.interfaces.Vlan100.accessGroup.out",
        expected: "ENT_ACL",
        message: "Sw101: VLAN 100 のアウトバウンド方向に ACL 'ENT_ACL' が適用されていません"
      },

      // --- タスク3: Sw102 Port Security ---
      // switchport port-security
      {
        device: "Sw102",
        path: "runningConfig.interfaces.Ethernet0/0.portSecurity.enabled",
        expected: true,
        message: "Sw102: Ethernet0/0 でポートセキュリティが有効化されていません"
      },
      // switchport port-security maximum 4
      {
        device: "Sw102",
        path: "runningConfig.interfaces.Ethernet0/0.portSecurity.maximum",
        expected: 4,
        message: "Sw102: 最大MACアドレス数が 4 ではありません"
      },
      // switchport port-security violation protect
      {
        device: "Sw102",
        path: "runningConfig.interfaces.Ethernet0/0.portSecurity.violation",
        expected: "protect",
        message: "Sw102: 違反モードが protect ではありません"
      },
      // switchport port-security mac-address sticky
      {
        device: "Sw102",
        path: "runningConfig.interfaces.Ethernet0/0.portSecurity.stickyMac",
        expected: true,
        message: "Sw102: sticky (動的学習) 設定が無効です"
      }
    ]
  },

// -------------------------------------------------------------
  // Question 7: VLANとCDPの設定
  // -------------------------------------------------------------
  {
    id: "question7",
    title: "Question 7",
    image: "img/question7.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>R1には必要なコマンドがすべて事前に設定されています。すべての物理ケーブルが接続され、検証済みです。PC1、PC3、およびサーバーからスイッチへの接続を確立し、各ポートで1つのVLANのみを許可する必要があります。</p>
      </div>
    `,
    tasks: [
      "PC3のスイッチポートに接続するVLANを「SALES」という名前で設定します",
      "Server1に接続するスイッチポートを設定します",
      "PC3に接続するスイッチポートを設定します",
      "R1がCisco独自の近隣探索プロトコルを使用してSW-1を検出し、ネットワーク上の他のすべてのデバイスがSW-1を検出できないことを確認します。"
    ],
    devices: [
      { name: "SW-1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2"] },
      { name: "SW-2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"] },
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      // --- タスク1 (Sw-2): VLAN 30 Name SALES ---
      { 
        device: "SW-2", 
        path: "runningConfig.vlans.30.name", 
        expected: "SALES", 
        message: "SW-2: VLAN 30 の名前が 'SALES' に設定されていません" 
      },
      
      // --- タスク2 (Sw-2): Server1 Port (e0/2) -> VLAN 20 ---
      { 
        device: "SW-2", 
        path: "runningConfig.interfaces.Ethernet0/2.switchport.mode", 
        expected: "access", 
        message: "SW-2: Ethernet0/2 (Server1) のモードが access ではありません" 
      },
      { 
        device: "SW-2", 
        path: "runningConfig.interfaces.Ethernet0/2.switchport.access_vlan", 
        expected: "20", 
        message: "SW-2: Ethernet0/2 (Server1) の VLAN が 20 に設定されていません" 
      },

      // --- タスク3 (Sw-2): PC3 Port (e0/3) -> VLAN 30 ---
      { 
        device: "SW-2", 
        path: "runningConfig.interfaces.Ethernet0/3.switchport.mode", 
        expected: "access", 
        message: "SW-2: Ethernet0/3 (PC3) のモードが access ではありません" 
      },
      { 
        device: "SW-2", 
        path: "runningConfig.interfaces.Ethernet0/3.switchport.access_vlan", 
        expected: "30", 
        message: "SW-2: Ethernet0/3 (PC3) の VLAN が 30 に設定されていません" 
      },

      // --- タスク4 (Sw-1): CDP Configuration ---
      { 
        device: "SW-1", 
        path: "runningConfig.cdp.enabled", 
        expected: true, 
        message: "SW-1: CDP がグローバルで有効化されていません (cdp run)" 
      },
      { 
        device: "SW-1", 
        path: "runningConfig.cdp.interfaces.Ethernet0/0", 
        condition: (val) => val !== false, 
        message: "SW-1: Ethernet0/0 で CDP が有効になっていません" 
      },
      { 
        device: "SW-1", 
        path: "runningConfig.cdp.interfaces.Ethernet0/1", 
        expected: false, 
        message: "SW-1: Ethernet0/1 で CDP が無効化されていません (no cdp enable)" 
      },
      { 
        device: "SW-1", 
        path: "runningConfig.cdp.interfaces.Ethernet0/2", 
        expected: false, 
        message: "SW-1: Ethernet0/2 で CDP が無効化されていません (no cdp enable)" 
      }
    ]
  },

// -------------------------------------------------------------
  // Question 8: OSPFの設定
  // -------------------------------------------------------------
  {
    id: "question8",
    title: "Question 8",
    image: "img/ospf_topology.png",
    description: `
      <div class="task-section">
        <p><strong>状況</strong></p>
        <p>トポロジー図を参照してください。すべての物理ケーブルは正しく接続されています。ルーター2と3にはアクセスできません。ネットワークのOSPFルーティングを設定し、ネットワークステートメントを使用せずにR1がエリア0に参加していることを確認してください。</p>
      </div>
    `,
    tasks: [
      `タスク 1.
R1 上でOSPF をプロセス ID とルーターIDのみを使用して以下のように設定します。
- プロセス IDとして33を使用
- ルーターIDとしてE0/1 IP (10.0.33.1) を使用`,

      `タスク 2.
- R1 が R2 およびR3とのネイバー隣接関係を確立するように設定します。OSPF プロセスの network ステートメントは使用しないでください。
- R1 が常にエリア0のDRになるように設定します。
- OSPFプロセスをクリアして再選出を促します。`
    ],
    devices: [
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R2", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] },
      { name: "R3", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      // --- タスク1: OSPF Process 33 & Router ID ---
      {
        device: "R1",
        path: "runningConfig.routing.ospf.33.routerId",
        expected: "10.0.33.1",
        message: "R1: OSPFプロセス 33 の router-id が 10.0.33.1 に設定されていません"
      },
      
      // --- タスク2: Interface E0/0 OSPF Config ---
      {
        device: "R1",
        path: "runningConfig.interfaces.Ethernet0/0.ospf.area",
        expected: "0",
        message: "R1: Ethernet0/0 が OSPF プロセス 33 の エリア 0 に参加していません (ip ospf 33 area 0)"
      },
      {
        device: "R1",
        path: "runningConfig.interfaces.Ethernet0/0.ospf.priority",
        expected: 255,
        message: "R1: Ethernet0/0 の OSPF priority が 255 に設定されていません"
      },
      
      // --- タスク2: Interface E0/1 OSPF Config ---
      {
        device: "R1",
        path: "runningConfig.interfaces.Ethernet0/1.ospf.area",
        expected: "0",
        message: "R1: Ethernet0/1 が OSPF プロセス 33 の エリア 0 に参加していません (ip ospf 33 area 0)"
      },
      {
        device: "R1",
        path: "runningConfig.interfaces.Ethernet0/1.ospf.priority",
        expected: 255,
        message: "R1: Ethernet0/1 の OSPF priority が 255 に設定されていません"
      },

      // --- タスク2: Clear OSPF Process Log ---
      {
        device: "R1",
        path: "runningConfig.logs",
        condition: (logs) => logs && logs.some(l => l.command === 'clear' && l.target === 'ip ospf process' || l.raw === 'clear ip ospf process'),
        message: "R1: DR選出のために OSPFプロセスがクリアされていません (clear ip ospf process)"
      }
    ]
  }
];

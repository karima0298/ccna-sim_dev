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

// =========================================================================================
// 【新】シミュレーション問題 (PDF版)
// =========================================================================================

  // -------------------------------------------------------------
  // 【新】問題①: VLANとLLDPの設定
  // -------------------------------------------------------------
  {
    id: "new_q1",
    title: "【新】問題①",
    image: "img/new_q1.png",
    description: `
      <div class="task-section">
        <p><strong>ガイドライン</strong></p>
        <p>R1には必要なコマンドがすべて事前に設定されています。すべての物理ケーブルが接続され、検証済みです。PC1とPC2はスイッチに接続を確立する必要があり、各ポートは1つのVLANのみを許可する必要があります。</p>
      </div>
    `,
    tasks: [
      "SW-1をVLAN 35に設定し、SALESというラベルを付けます",
      "SW-2をVLAN 39に設定し、MARKETINGというラベルを付けます",
      "PC1に接続するスイッチポートを設定します",
      "PC2に接続するスイッチポートを設定します",
      "業界標準プロトコルを使用して、SW-1とSW-2をユニバーサルネイバーディスカバリに設定し、PC1に接続するインターフェースで無効にします。"
    ],
    devices: [
      { name: "SW-1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2"] },
      { name: "SW-2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2"] }
    ],
    validations: [
      { device: "SW-1", path: "runningConfig.vlans.35.name", expected: "SALES", message: "SW-1: VLAN 35 の名前が SALES ではありません" },
      { device: "SW-2", path: "runningConfig.vlans.39.name", expected: "MARKETING", message: "SW-2: VLAN 39 の名前が MARKETING ではありません" },
      { device: "SW-1", path: "runningConfig.interfaces.Ethernet0/2.switchport.mode", expected: "access", message: "SW-1: Ethernet0/2 のモードが access ではありません" },
      { device: "SW-1", path: "runningConfig.interfaces.Ethernet0/2.switchport.access_vlan", expected: "35", message: "SW-1: Ethernet0/2 が VLAN 35 に割り当てられていません" },
      { device: "SW-2", path: "runningConfig.interfaces.Ethernet0/2.switchport.mode", expected: "access", message: "SW-2: Ethernet0/2 のモードが access ではありません" },
      { device: "SW-2", path: "runningConfig.interfaces.Ethernet0/2.switchport.access_vlan", expected: "39", message: "SW-2: Ethernet0/2 が VLAN 39 に割り当てられていません" },
      { device: "SW-1", path: "runningConfig.lldp.enabled", expected: true, message: "SW-1: LLDPがグローバルで有効になっていません" },
      { device: "SW-2", path: "runningConfig.lldp.enabled", expected: true, message: "SW-2: LLDPがグローバルで有効になっていません" },
      { device: "SW-1", path: "runningConfig.lldp.interfaces.Ethernet0/2.receive", expected: false, message: "SW-1: Ethernet0/2 で lldp receive が無効になっていません" },
      { device: "SW-1", path: "runningConfig.lldp.interfaces.Ethernet0/2.transmit", expected: false, message: "SW-1: Ethernet0/2 で lldp transmit が無効になっていません" },
      // ★ 設定保存チェック
      { device: "SW-1", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "SW-1: 設定が保存されていません (copy run start を実行してください)" },
      { device: "SW-2", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "SW-2: 設定が保存されていません (copy run start を実行してください)" }
    ]
  },

  // -------------------------------------------------------------
  // 【新】問題②: VLANとCDPの設定
  // -------------------------------------------------------------
  {
    id: "new_q2",
    title: "【新】問題②",
    image: "img/new_q2.png",
    description: `
      <div class="task-section">
        <p><strong>ガイドライン</strong></p>
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
      { name: "SW-2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"] }
    ],
    validations: [
      { device: "SW-2", path: "runningConfig.vlans.30.name", expected: "SALES", message: "SW-2: VLAN 30 の名前が SALES ではありません" },
      { device: "SW-2", path: "runningConfig.interfaces.Ethernet0/2.switchport.mode", expected: "access", message: "SW-2: Ethernet0/2 (Server1) が access モードではありません" },
      { device: "SW-2", path: "runningConfig.interfaces.Ethernet0/2.switchport.access_vlan", expected: "20", message: "SW-2: Ethernet0/2 が VLAN 20 に設定されていません" },
      { device: "SW-2", path: "runningConfig.interfaces.Ethernet0/3.switchport.mode", expected: "access", message: "SW-2: Ethernet0/3 (PC3) が access モードではありません" },
      { device: "SW-2", path: "runningConfig.interfaces.Ethernet0/3.switchport.access_vlan", expected: "30", message: "SW-2: Ethernet0/3 が VLAN 30 に設定されていません" },
      { device: "SW-1", path: "runningConfig.cdp.enabled", expected: true, message: "SW-1: CDPがグローバルで有効になっていません" },
      { device: "SW-1", path: "runningConfig.cdp.interfaces.Ethernet0/0", condition: (val) => val !== false, message: "SW-1: Ethernet0/0 で CDP が有効になっていません" },
      { device: "SW-1", path: "runningConfig.cdp.interfaces.Ethernet0/1", expected: false, message: "SW-1: Ethernet0/1 で CDP が無効になっていません" },
      { device: "SW-1", path: "runningConfig.cdp.interfaces.Ethernet0/2", expected: false, message: "SW-1: Ethernet0/2 で CDP が無効になっていません" },
      // ★ 設定保存チェック
      { device: "SW-1", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "SW-1: 設定が保存されていません (copy run start を実行してください)" },
      { device: "SW-2", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "SW-2: 設定が保存されていません (copy run start を実行してください)" }
    ]
  },

  // -------------------------------------------------------------
  // 【新】問題③: OSPF ネットワークアドバタイズ
  // -------------------------------------------------------------
  {
    id: "new_q3",
    title: "【新】問題③",
    image: "img/new_q3.png",
    description: `
      <div class="task-section">
        <p><strong>ガイドライン</strong></p>
        <p>※設定できるのはR2のみです。</p>
      </div>
    `,
    tasks: [
      "R2でOSPFを設定し、R1 と R2 がネイバーになることを確認します。<br>・プロセス ID として 10 を使用<br>・ルーター ID として L0のIP を使用<br>・R1がR2およびR3とのネイバー隣接関係を確立するように設定してください。使用されているプレフィックスと完全に一致するように接続されたネットワークをアドバタイズします。",
      "R2が常にエリア0のDRになるように設定してください。"
    ],
    devices: [
      { name: "R2", type: "router", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      { 
        device: "R2", 
        path: "runningConfig", 
        condition: (config) => config?.routing?.ospf?.['10']?.routerId === '10.2.2.2', 
        message: "R2: OSPF 10 のルーターIDが 10.2.2.2 に設定されていません" 
      },
      { 
        device: "R2", 
        path: "runningConfig", 
        condition: (config) => {
            const nets = config?.routing?.ospf?.['10']?.networks;
            return nets && nets.some(n => n.ip === '10.2.2.2' && n.wildcard === '0.0.0.0' && n.area === '0');
        }, 
        message: "R2: network 10.2.2.2 0.0.0.0 area 0 が設定されていません" 
      },
      { 
        device: "R2", 
        path: "runningConfig", 
        condition: (config) => {
            const nets = config?.routing?.ospf?.['10']?.networks;
            return nets && nets.some(n => n.ip === '10.0.12.0' && n.wildcard === '0.0.0.3' && n.area === '0');
        }, 
        message: "R2: network 10.0.12.0 0.0.0.3 area 0 が設定されていません" 
      },
      { 
        device: "R2", 
        path: "runningConfig", 
        condition: (config) => {
            const nets = config?.routing?.ospf?.['10']?.networks;
            return nets && nets.some(n => n.ip === '10.0.23.0' && n.wildcard === '0.0.0.15' && n.area === '0');
        }, 
        message: "R2: network 10.0.23.0 0.0.0.15 area 0 が設定されていません" 
      },
      { device: "R2", path: "runningConfig.interfaces.Ethernet0/0.ospf.priority", expected: 255, message: "R2: Ethernet0/0 の OSPF priority が 255 に設定されていません" },
      { device: "R2", path: "runningConfig.interfaces.Ethernet0/1.ospf.priority", expected: 255, message: "R2: Ethernet0/1 の OSPF priority が 255 に設定されていません" },
      { device: "R2", path: "runningConfig.logs", condition: (logs) => logs && logs.some(l => l.command === 'clear' && l.target === 'ip ospf process'), message: "R2: OSPFプロセスのクリアが実行されていません" },
      // ★ 設定保存チェック
      { device: "R2", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "R2: 設定が保存されていません (copy run start を実行してください)" }
    ]
  },

  // -------------------------------------------------------------
  // 【新】問題④: IPv4 & IPv6 アドレス設定
  // -------------------------------------------------------------
  {
    id: "new_q4",
    title: "【新】問題④",
    image: "img/new_q4.png",
    description: `
      <div class="task-section">
        <p><strong>ガイドライン</strong></p>
        <p>指定されたサブネットを使用して、R1およびR2のインターフェースに適切なIPアドレスを設定してください。</p>
      </div>
    `,
    tasks: [
      "R1に、ipv4 ネットワークで使用可能な最初のホスト IP アドレスを設定します。<br>R2に、IPv4 ネットワークで使用可能な最後のホスト IP アドレスを設定します。",
      "R1 にIPv6 ネットワークで使用可能な最初のホスト IP アドレスを設定します。<br>R2 にIPv6 ネットワークで使用可能な最後のホスト IP アドレスを設定します。"
    ],
    devices: [
      { name: "R1", type: "router", physicalPorts: ["Ethernet0/0"] },
      { name: "R2", type: "router", physicalPorts: ["Ethernet0/0"] }
    ],
    validations: [
      { device: "R1", path: "runningConfig.interfaces.Ethernet0/0.ip", expected: "10.0.12.5", message: "R1: IPv4アドレスが 10.0.12.5 に設定されていません" },
      { device: "R1", path: "runningConfig.interfaces.Ethernet0/0.mask", expected: "255.255.255.252", message: "R1: IPv4サブネットマスクが 255.255.255.252 ではありません" },
      { device: "R2", path: "runningConfig.interfaces.Ethernet0/0.ip", expected: "10.0.12.6", message: "R2: IPv4アドレスが 10.0.12.6 に設定されていません" },
      { device: "R1", path: "runningConfig.interfaces.Ethernet0/0.ipv6", expected: "2001:db8:12::1/126", message: "R1: IPv6アドレスが 2001:db8:12::1/126 に設定されていません" },
      { device: "R2", path: "runningConfig.interfaces.Ethernet0/0.ipv6", expected: "2001:db8:12::3/126", message: "R2: IPv6アドレスが 2001:db8:12::3/126 に設定されていません" },
      { device: "R1", path: "runningConfig.interfaces.Ethernet0/0.status", expected: "up", message: "R1: インターフェースが起動していません (no shut)" },
      { device: "R2", path: "runningConfig.interfaces.Ethernet0/0.status", expected: "up", message: "R2: インターフェースが起動していません (no shut)" },
      // ★ 設定保存チェック
      { device: "R1", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "R1: 設定が保存されていません (copy run start を実行してください)" },
      { device: "R2", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "R2: 設定が保存されていません (copy run start を実行してください)" }
    ]
  },

  // -------------------------------------------------------------
  // 【新】問題⑤: トランクとEtherChannel (LACP)
  // -------------------------------------------------------------
  {
    id: "new_q5",
    title: "【新】問題⑤",
    image: "img/new_q5.png",
    description: `
      <div class="task-section">
        <p><strong>ガイドライン</strong></p>
        <p>設定できるのはSW1とSW2のみです。</p>
      </div>
    `,
    tasks: [
      "IEEE 標準フレームタグ付け方式を使用して、ポートEO/0とE0/1 上でSW1 と SW2間のトランクを設定します。<br>またVLAN1,11,12のみが通信出来るように設定します",
      "vlan12のみを許可するようにSW1の0/2を設定します",
      "Sw1とSw2でLACPを設定します。<br>E0/0とEO/1を単一の論理リンクに統合し、トランク構成はそのまま維持します。<br>リンクに番号12を割り当てます。<br>両方のリンクでネゴシエーションを行う必要があります。"
    ],
    devices: [
      { name: "Sw1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2"] },
      { name: "Sw2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1"] }
    ],
    validations: [
      // Sw1, Sw2 e0/0, e0/1 Trunk & EtherChannel
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/0.switchport.encapsulation", expected: "dot1q", message: "Sw1: E0/0 のトランクカプセル化が dot1q ではありません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/0.switchport.mode", expected: "trunk", message: "Sw1: E0/0 が trunk モードではありません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/0.switchport.allowed_vlans", match: "containsAll", expected: ["1", "11", "12"], message: "Sw1: E0/0 で VLAN 1, 11, 12 が許可されていません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/0.channelGroup.id", expected: "12", message: "Sw1: E0/0 が channel-group 12 に設定されていません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/0.channelGroup.mode", expected: "active", message: "Sw1: E0/0 の LACPモード が active ではありません" },
      
      { device: "Sw2", path: "runningConfig.interfaces.Ethernet0/0.switchport.encapsulation", expected: "dot1q", message: "Sw2: E0/0 のトランクカプセル化が dot1q ではありません" },
      { device: "Sw2", path: "runningConfig.interfaces.Ethernet0/0.channelGroup.mode", expected: "active", message: "Sw2: E0/0 の LACPモード が active ではありません" },
      
      // Sw1 e0/2 Trunk Allowed 12
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/2.switchport.encapsulation", expected: "dot1q", message: "Sw1: E0/2 のトランクカプセル化が dot1q ではありません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/2.switchport.mode", expected: "trunk", message: "Sw1: E0/2 が trunk モードではありません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/2.switchport.allowed_vlans", match: "contains", expected: "12", message: "Sw1: E0/2 で VLAN 12 が許可されていません" },
      
      // ★ 設定保存チェック
      { device: "Sw1", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "Sw1: 設定が保存されていません (copy run start を実行してください)" },
      { device: "Sw2", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "Sw2: 設定が保存されていません (copy run start を実行してください)" }
    ]
  },

  // -------------------------------------------------------------
  // 【新】問題⑥: Voice VLAN と LLDP
  // -------------------------------------------------------------
  {
    id: "new_q6",
    title: "【新】問題⑥",
    image: "img/new_q6.png",
    description: `
      <div class="task-section">
        <p><strong>ガイドライン</strong></p>
        <p>物理的なケーブル配線はすべて完了し、検証済みです。スイッチのE0/1、E0/2、E0/3ポートの接続は、音声およびデータ通信機能に対応できるよう設定され、利用可能である必要があります。</p>
      </div>
    `,
    tasks: [
      "Sw1とSw2の両方にVLANを設定し、トポロジーで指定されたVLAN名に従って名前を付けます。",
      "両方のスイッチのE0/1、E0/2、およびE0/3ポートを両方のVLAN用に設定し、Cisco IP電話とPCがトラフィックを通過できるようにします。",
      "e0/0 上でベンダーニュートラルプロトコルを介してネイバー検出を許可するように Sw1とSw2 を設定します。"
    ],
    devices: [
      { name: "Sw1", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"] },
      { name: "Sw2", type: "switch", physicalPorts: ["Ethernet0/0", "Ethernet0/1", "Ethernet0/2", "Ethernet0/3"] }
    ],
    validations: [
      { device: "Sw1", path: "runningConfig.vlans.77.name", expected: "User VLAN", message: "Sw1: VLAN 77 の名前が 'User VLAN' ではありません" },
      { device: "Sw1", path: "runningConfig.vlans.177.name", expected: "Voice VLAN", message: "Sw1: VLAN 177 の名前が 'Voice VLAN' ではありません" },
      { device: "Sw2", path: "runningConfig.vlans.77.name", expected: "User VLAN", message: "Sw2: VLAN 77 の名前が 'User VLAN' ではありません" },
      
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/1.switchport.mode", expected: "access", message: "Sw1: E0/1 が access モードではありません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/1.switchport.access_vlan", expected: "77", message: "Sw1: E0/1 に Data VLAN 77 が設定されていません" },
      { device: "Sw1", path: "runningConfig.interfaces.Ethernet0/1.switchport.voice_vlan", expected: "177", message: "Sw1: E0/1 に Voice VLAN 177 が設定されていません" },
      
      { device: "Sw2", path: "runningConfig.interfaces.Ethernet0/3.switchport.voice_vlan", expected: "177", message: "Sw2: E0/3 に Voice VLAN 177 が設定されていません" },

      { device: "Sw1", path: "runningConfig.lldp.enabled", expected: true, message: "Sw1: LLDPがグローバルで有効になっていません (lldp run)" },
      { device: "Sw1", path: "runningConfig.lldp.interfaces.Ethernet0/0.transmit", expected: true, message: "Sw1: E0/0 で lldp transmit が設定されていません" },
      { device: "Sw1", path: "runningConfig.lldp.interfaces.Ethernet0/0.receive", expected: true, message: "Sw1: E0/0 で lldp receive が設定されていません" },
      
      { device: "Sw2", path: "runningConfig.lldp.enabled", expected: true, message: "Sw2: LLDPがグローバルで有効になっていません (lldp run)" },
      { device: "Sw2", path: "runningConfig.lldp.interfaces.Ethernet0/0.transmit", expected: true, message: "Sw2: E0/0 で lldp transmit が設定されていません" },
      
      // ★ 設定保存チェック
      { device: "Sw1", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "Sw1: 設定が保存されていません (copy run start または write を実行してください)" },
      { device: "Sw2", path: "runningConfig.startupConfig", condition: (val) => val != null, message: "Sw2: 設定が保存されていません (copy run start または write を実行してください)" }
    ]
  }
];

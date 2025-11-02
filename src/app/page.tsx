"use client";

import Image from "next/image";
import { metaMask } from "wagmi/connectors";
import { useAccount, useConnect, useDisconnect, useSendCalls, useChainId, useSwitchChain } from "wagmi";
import { useState, useEffect, useRef } from "react";
import { getCallsStatus } from "@wagmi/core";
import { wagmiConfig as config } from "@/providers/AppProvider";
import { parseEther } from "viem";
import { mainnet, polygon, bsc, arbitrum, base } from "viem/chains";

// Supported chain configuration
const SUPPORTED_CHAINS = [
  { id: mainnet.id, name: 'Ethereum', logo: '/ethereum-logo.svg' },
  { id: polygon.id, name: 'Polygon', logo: '/polygon-logo.svg' },
  { id: bsc.id, name: 'BSC', logo: '/bnb-logo.svg' },
  { id: arbitrum.id, name: 'Arbitrum', logo: '/arbitrum-logo.svg' },
  { id: base.id, name: 'Base', logo: '/base-logo.svg' },
];

// Chain ID to chain name mapping
const CHAIN_NAMES = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'Binance Smart Chain',
  42161: 'Arbitrum',
  8453: 'Base'
};

// Get block explorer URL based on chain ID
function getExplorerUrl(chainId: number, txHash: string): string {
  const explorerUrls = {
    1: `https://etherscan.io/tx/${txHash}`, // Ethereum
    137: `https://polygonscan.com/tx/${txHash}`, // Polygon
    56: `https://bscscan.com/tx/${txHash}`, // BSC
    42161: `https://arbiscan.io/tx/${txHash}`, // Arbitrum
    8453: `https://basescan.org/tx/${txHash}`, // Base
  };
  return explorerUrls[chainId as keyof typeof explorerUrls] || `https://etherscan.io/tx/${txHash}`;
}

// Language type
type Language = 'zh' | 'en';

// Transaction type
type Transaction = {
  type: 'native_transfer' | 'erc20_transfer' | 'erc20_approve' | 'custom_data';
  to: string;
  value: string;
  data: string;
};

// Text mapping
const texts = {
  zh: {
    title: '原子批量交易工具',
    subtitle: '基于Metamask智能账户（EIP-7702），让批量交易更安全、更便捷、更高效、更节省Gas费！',
    connectWallet: '连接钱包',
    disconnect: '断开连接',
    switchNetwork: '切换网络',
    configureTransactions: '配置批量交易',
    addTransaction: '添加交易',
    transactionType: '交易类型',
    nativeTransfer: '原生转账',
    erc20Transfer: 'ERC20 转账',
    erc20Approve: 'ERC20 授权',
    customTransaction: '自定义交易',
    recipient: '接收地址',
    amount: '数量',
    tokenAddress: '代币合约地址',
    data: '数据',
    add: '添加',
    transactionList: '☰ 交易列表',
    noTransactions: '暂无交易',
    sendBatchTransaction: '发送批量交易',
    sendBatchTransactionWithGas: '发送批量交易（只需花费1次Gas费）',
    sendingTransaction: '正在发送交易...',
    checkStatus: '🔍 检查交易状态',
    checkingStatus: '正在检查状态...',
    transactionHash: '交易哈希',
    status: '状态',
    viewOnExplorer: '在区块浏览器中查看',
    error: '错误',
    success: '成功',
    pending: '等待中',
    failed: '失败',
    gasLimitExceeded: 'Gas Limit 超限',
    gasLimitExceededDesc: '该笔交易可能含有一些特殊的代币合约导致该笔批量交易所需 Gas 异常偏高，建议移除这类交易后重试（或分批发送）。',
    smartAccountError: '需要关闭智能账户功能',
    smartAccountErrorDesc: '检测到账户已升级为不支持的合约版本。请按照以下步骤操作：',
    solutionSteps: '解决步骤：',
    openMetaMask: '打开 MetaMask 钱包',
    clickAccountIcon: '点击右上角 "☰"',
    selectAccountDetails: '选择 "账户详情"',
    findSmartAccount: '设置 "智能账户"',
    clickDisableSmartAccount: '关闭相关链的智能账户（需支付Gas费）',
    returnAndRetry: '返回此页面重新尝试批量交易',
    smartAccountTip: '提示：你的账户将会自动重新升级为 MetaMask Smart Account，并进行批量交易。',
    addTransactionFirst: '请先添加交易',
    addTransactionFirstDesc: '在上方"配置批量交易"区域添加至少一笔交易后才能执行批量操作',
    checkDataField: '请检查 data 字段：应为 138 字符（含 0x 前缀）',
    transactionCount: '笔交易',
    showFirst: '仅显示前',
    originalCount: '原交易数量',
    actualSent: '实际发送',
    addressRequired: '请输入有效的接收地址',
    amountRequired: '请输入有效的数量',
    tokenAddressRequired: '请输入有效的代币地址',
    dataRequired: '请输入有效的十六进制数据',
    invalidAddress: '地址格式无效（需要 0x 开头的 42 位字符）',
    invalidAmount: '数量必须大于 0',
    invalidData: '数据格式无效（需要 0x 开头的十六进制字符串）',
    enterRecipientAddress: '请输入接收地址',
    enterAmount: '请输入转账金额',
    enterTokenAddress: '请输入代币合约地址',
    enterRecipient: '请输入接收地址',
    enterAmount2: '请输入转账数量',
    enterSpenderAddress: '请输入 spender 地址',
    enterDataField: '请输入 Data 字段',
    addAtLeastOneTransaction: '请先添加至少一笔交易',
    addressFormatError: '接收地址格式错误，应为 0x 开头的42位字符',
    tokenAddressFormatError: '代币合约地址格式错误，应为 0x 开头的42位字符',
    spenderAddressFormatError: 'Spender 地址格式错误，应为 0x 开头的42位字符',
    enterValidAmount: '请输入有效的金额（大于0）',
    enterValidAmount2: '请输入有效的数量（大于0）',
    dataFieldMustStartWith0x: 'Data 字段必须以 0x 开头',
    // 新增的文本
    switchChainFailed: '切换链失败',
    validateAddressFormat: '验证地址格式',
    validateAmount: '验证金额',
    validateQuantity: '验证数量',
    calculateAmountWithDecimals: '计算带小数位的数量，使用更精确的方式',
    useStringToAvoidPrecision: '使用字符串避免浮点精度问题',
    convertToBigIntToAvoidPrecision: '转换为 BigInt 避免精度损失',
    generateTransferData: '生成 transfer(address to, uint256 amount) 的 data',
    functionSelector: '函数选择器',
    erc20TransferValueMustBeZero: 'ERC20 转账 value 必须为 0',
    erc20ApproveValueMustBeZero: 'ERC20 授权 value 必须为 0',
    unlimitedApproval: '无限授权',
    hasInputAmount: '有输入数量，计算带小数位的数量，使用精确方式',
    clearForm: '清空表单',
    onlyUseCustomConfig: '只使用自定义配置',
    eip7702MaxSupport: 'EIP-7702 最多支持10笔交易，自动截取前10笔',
    batchTransactionCount: '批量交易数量为',
    automaticallyTruncated: '笔，已自动截取前',
    remainingUnprocessed: '笔执行。剩余',
    unprocessed: '笔未处理。',
    originalTransactionCount: '原交易数量',
    actuallySent: '实际发送',
    networkSwitchedMessage: '网络已切换',
    hideNetworkSwitchMessage: '3秒后隐藏网络切换提示',
    clickOutsideToClose: '点击外部关闭下拉菜单',
    switchChainFailedMessage: '切换链失败',
    detectMetaMaskAvailable: '检测 MetaMask 是否可用',
    listenToChainChanges: '监听链变化',
    chainChanged: '链发生了变化',
    consoleLogNetworkSwitch: '网络已切换',
    hideNetworkSwitchAfter3Seconds: '3秒后隐藏网络切换提示',
    clickOutsideToCloseDropdown: '点击外部关闭下拉菜单',
    consoleErrorSwitchChainFailed: '切换链失败',
    manualTransactionConfig: '手动输入交易配置',
    erc20TransferAndApproveFields: 'ERC20 转账和授权专用字段',
    default18Decimals: '默认18位小数',
    detectMetaMaskAvailability: '检测 MetaMask 是否可用',
    consoleLogNetworkSwitched: '网络已切换',
    hideNetworkSwitchMessageAfter3Seconds: '3秒后隐藏网络切换提示',
    clickOutsideToCloseDropdownMenu: '点击外部关闭下拉菜单',
    // 新增的UI文本
    topNavigationBar: '顶部导航栏',
    rightButtonGroup: '右侧按钮组',
    languageSwitchButton: '语言切换按钮',
    chainSelectionDropdown: '链选择下拉菜单',
    dropdownMenuTrigger: '下拉菜单触发器',
    dropdownMenuOptions: '下拉菜单选项',
    walletConnectionButton: '钱包连接按钮',
    mainContentArea: '主要内容区域',
    metamaskErrorPrompt: 'MetaMask 错误提示',
    cannotConnectToMetamask: '无法连接到 MetaMask',
    metamaskNotInstalled: 'MetaMask 未安装或未启用。请先安装 MetaMask 扩展。',
    connectionFailed: '连接失败',
    unknownError: '未知错误',
    cannotConnectToMetamaskWithError: '无法连接到MetaMask',
    pleaseInstallMetamaskFirst: '请先安装 MetaMask 扩展',
    // Header/status and network info
    connectedTo: '已连接到',
    networkInfoTitle: '网络信息',
    networkChangedPrompt: '网络已切换',
    currentChainLabel: '当前链',
    unknownChain: '未知链',
    chainIdLabel: '链ID',
    addressLabel: '地址',
    // Form labels and helpers
    transferAmountLabel: '转账数量',
    decimalsSuffix: '位小数',
    autoFillDecimalsTip: '系统会自动补充小数位，例如输入 1 表示 1 个完整代币',
    spenderAddressLabel: 'Spender 地址',
    approvalAmountLabel: '授权数量',
    unlimitedApprovalPlaceholder: '留空表示无限授权',
    unlimitedApprovalNote: '留空将设置为无限授权 (max uint256)',
    amountEthLabel: '金额',
    dataFieldLabel: 'Data 字段',
    clearList: '清空列表',
    batchTransactionsTitle: '执行原子批量交易',
    // 分享功能
    share: '分享',
    tweet: '推文',
    copy: '复制'
  },
  en: {
    title: 'Atomic Batch Transaction Tool',
    subtitle: 'Powered by Metamask Smart Accounts, making batch transactions safer, easier, more efficient and more gas-saving!',
    connectWallet: 'ConnectWallet',
    disconnect: 'Disconnect',
    switchNetwork: 'Switch Network',
    configureTransactions: 'Configure Batch Transactions',
    addTransaction: 'Add Transaction',
    transactionType: 'Transaction Type',
    nativeTransfer: 'Native Transfer',
    erc20Transfer: 'ERC20 Transfer',
    erc20Approve: 'ERC20 Approve',
    customTransaction: 'Custom Transaction',
    recipient: 'Recipient Address',
    amount: 'Amount',
    tokenAddress: 'Token Address',
    data: 'Data',
    add: 'Add',
    transactionList: '☰ Transaction List',
    noTransactions: 'No transactions',
    sendBatchTransaction: 'Send Batch Transaction',
    sendBatchTransactionWithGas: 'Send Batch Transaction (Only 1 Gas Fee)',
    sendingTransaction: 'Sending Transaction...',
    checkStatus: '🔍️ Check Transaction Status',
    checkingStatus: 'Checking Status...',
    transactionHash: 'Transaction Hash',
    status: 'Status',
    viewOnExplorer: 'View on Explorer',
    error: 'Error',
    success: 'Success',
    pending: 'Pending',
    failed: 'Failed',
    gasLimitExceeded: 'Gas Limit Exceeded',
    gasLimitExceededDesc: 'This transaction may contain some special token contracts, causing the gas required for this batch transaction to be unusually high. Please remove those transactions and retry (or split into smaller batches).',
    smartAccountError: 'Need to disable smart account feature',
    smartAccountErrorDesc: 'Detected that the account has been upgraded to an unsupported contract version. Please follow these steps:',
    solutionSteps: 'Solution steps:',
    openMetaMask: 'Open MetaMask wallet',
    clickAccountIcon: 'Click the "☰" in the top right corner',
    selectAccountDetails: 'Select "Account Details"',
    findSmartAccount: 'Set up "Smart Account"',
    clickDisableSmartAccount: 'Close the smart account related to the chain (requires gas fee)',
    returnAndRetry: 'Return to this page and retry batch transactions',
    smartAccountTip: 'Tip: Your account will be automatically upgraded to a MetaMask Smart Account and will be able to perform batch transactions.',
    addTransactionFirst: 'Please add transactions first',
    addTransactionFirstDesc: 'Add at least one transaction in the "Configure Batch Transactions" area above before executing batch operations',
    checkDataField: 'Please check the data field: should be 138 characters (including 0x prefix)',
    transactionCount: 'transactions',
    showFirst: 'Show first',
    originalCount: 'Original count',
    actualSent: 'Actually sent',
    addressRequired: 'Please enter a valid recipient address',
    amountRequired: 'Please enter a valid amount',
    tokenAddressRequired: 'Please enter a valid token address',
    dataRequired: 'Please enter valid hexadecimal data',
    invalidAddress: 'Invalid address format (needs 0x prefix and 42 characters)',
    invalidAmount: 'Amount must be greater than 0',
    invalidData: 'Invalid data format (needs 0x prefix hexadecimal string)',
    enterRecipientAddress: 'Please enter recipient address',
    enterAmount: 'Please enter amount',
    enterTokenAddress: 'Please enter token contract address',
    enterRecipient: 'Please enter recipient address',
    enterAmount2: 'Please enter amount',
    enterSpenderAddress: 'Please enter spender address',
    enterDataField: 'Please enter Data field',
    addAtLeastOneTransaction: 'Please add at least one transaction',
    addressFormatError: 'Recipient address format error, should be 0x prefix with 42 characters',
    tokenAddressFormatError: 'Token contract address format error, should be 0x prefix with 42 characters',
    spenderAddressFormatError: 'Spender address format error, should be 0x prefix with 42 characters',
    enterValidAmount: 'Please enter valid amount (greater than 0)',
    enterValidAmount2: 'Please enter valid amount (greater than 0)',
    dataFieldMustStartWith0x: 'Data field must start with 0x',
    // 新增的文本
    switchChainFailed: 'Failed to switch chain',
    validateAddressFormat: 'Validate address format',
    validateAmount: 'Validate amount',
    validateQuantity: 'Validate quantity',
    calculateAmountWithDecimals: 'Calculate amount with decimals using more precise method',
    useStringToAvoidPrecision: 'Use string to avoid floating point precision issues',
    convertToBigIntToAvoidPrecision: 'Convert to BigInt to avoid precision loss',
    generateTransferData: 'Generate transfer(address to, uint256 amount) data',
    functionSelector: 'Function selector',
    erc20TransferValueMustBeZero: 'ERC20 transfer value must be 0',
    erc20ApproveValueMustBeZero: 'ERC20 approve value must be 0',
    unlimitedApproval: 'Unlimited approval',
    hasInputAmount: 'Has input amount, calculate amount with decimals using precise method',
    clearForm: 'Clear form',
    onlyUseCustomConfig: 'Only use custom configuration',
    eip7702MaxSupport: 'EIP-7702 supports maximum 10 transactions, automatically truncate first 10',
    batchTransactionCount: 'Batch transaction count is',
    automaticallyTruncated: 'transactions, automatically truncated first',
    remainingUnprocessed: 'transactions executed. Remaining',
    unprocessed: 'transactions unprocessed.',
    originalTransactionCount: 'Original transaction count',
    actuallySent: 'Actually sent',
    networkSwitchedMessage: 'Network switched',
    hideNetworkSwitchMessage: 'Hide network switch message after 3 seconds',
    clickOutsideToClose: 'Click outside to close dropdown menu',
    switchChainFailedMessage: 'Failed to switch chain',
    detectMetaMaskAvailable: 'Detect if MetaMask is available',
    listenToChainChanges: 'Listen to chain changes',
    chainChanged: 'Chain has changed',
    consoleLogNetworkSwitch: 'Network switched',
    hideNetworkSwitchAfter3Seconds: 'Hide network switch message after 3 seconds',
    clickOutsideToCloseDropdown: 'Click outside to close dropdown menu',
    consoleErrorSwitchChainFailed: 'Failed to switch chain',
    manualTransactionConfig: 'Manual transaction configuration',
    erc20TransferAndApproveFields: 'ERC20 transfer and approve specific fields',
    default18Decimals: 'Default 18 decimals',
    detectMetaMaskAvailability: 'Detect MetaMask availability',
    consoleLogNetworkSwitched: 'Network switched',
    hideNetworkSwitchMessageAfter3Seconds: 'Hide network switch message after 3 seconds',
    clickOutsideToCloseDropdownMenu: 'Click outside to close dropdown menu',
    // 新增的UI文本
    topNavigationBar: 'Top navigation bar',
    rightButtonGroup: 'Right button group',
    languageSwitchButton: 'Language switch button',
    chainSelectionDropdown: 'Chain selection dropdown',
    dropdownMenuTrigger: 'Dropdown menu trigger',
    dropdownMenuOptions: 'Dropdown menu options',
    walletConnectionButton: 'Wallet connection button',
    mainContentArea: 'Main content area',
    metamaskErrorPrompt: 'MetaMask error prompt',
    cannotConnectToMetamask: 'Cannot connect to MetaMask',
    metamaskNotInstalled: 'MetaMask not installed or not enabled. Please install MetaMask extension first.',
    connectionFailed: 'Connection failed',
    unknownError: 'Unknown error',
    cannotConnectToMetamaskWithError: 'Cannot connect to MetaMask',
    pleaseInstallMetamaskFirst: 'Please install MetaMask extension first',
    // Header/status and network info
    connectedTo: 'Connected to',
    networkInfoTitle: 'Network Info',
    networkChangedPrompt: 'Network switched',
    currentChainLabel: 'Current chain',
    unknownChain: 'Unknown chain',
    chainIdLabel: 'Chain ID',
    addressLabel: 'Address',
    // Form labels and helpers
    transferAmountLabel: 'Transfer amount',
    decimalsSuffix: ' decimals',
    autoFillDecimalsTip: 'Decimals will be auto-filled, e.g. 1 means 1 whole token',
    spenderAddressLabel: 'Spender address',
    approvalAmountLabel: 'Approval amount',
    unlimitedApprovalPlaceholder: 'Leave empty for unlimited approval',
    unlimitedApprovalNote: 'Empty means unlimited approval (max uint256)',
    amountEthLabel: 'Amount',
    dataFieldLabel: 'Data field',
    clearList: 'Clear list',
    batchTransactionsTitle: 'Execute atomic batch transactions',
    // 分享功能
    share: 'Share',
    tweet: 'Tweet',
    copy: 'Copy'
  }
};

// Get native currency name based on chain ID
function getNativeCurrencyName(chainId: number | undefined): string {
  if (!chainId) return 'ETH';
  switch (chainId) {
    case 56: // BSC
      return 'BNB';
    case 137: // Polygon
      return 'POL';
    default:
      return 'ETH';
  }
}

export default function Home() {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendCalls, error, isPending, isSuccess, data, reset } = useSendCalls();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [networkChanged, setNetworkChanged] = useState(false);
  const [previousChainId, setPreviousChainId] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const chainDropdownRef = useRef<HTMLDivElement>(null);
  const [metaMaskError, setMetaMaskError] = useState<string | null>(null);
  const [isTransactionTypeDropdownOpen, setIsTransactionTypeDropdownOpen] = useState(false);
  const transactionTypeDropdownRef = useRef<HTMLDivElement>(null);
  
  // 分享功能
  const handleShare = async () => {
    const url = window.location.href;
    const title = t.title;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch (err) {
        console.log('分享被取消或失败:', err);
      }
    } else {
      // 降级到复制链接
      handleCopy();
    }
  };

  const handleTweet = () => {
    const url = window.location.href;
    const text = `${t.title} - 原子批量交易工具`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // 可以添加一个简单的提示
      console.log('链接已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  
  // Manual transaction configuration
  const [customTransactions, setCustomTransactions] = useState<Transaction[]>([]);
  const [customTo, setCustomTo] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customData, setCustomData] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState<'native' | 'erc20_transfer' | 'erc20_approve' | 'custom'>('native');
  
  // ERC20 transfer and approve specific fields
  const [erc20TokenAddress, setErc20TokenAddress] = useState('');
  const [erc20Amount, setErc20Amount] = useState('');
  const [erc20Recipient, setErc20Recipient] = useState('');
  const [erc20Decimals, setErc20Decimals] = useState(18); // Default 18 decimals
  const [erc20Spender, setErc20Spender] = useState('');
  
  // Detect if MetaMask is available
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window !== 'undefined') {
        const ethereum = (window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum;
        setIsMetaMaskAvailable(!!ethereum?.isMetaMask);
      }
    };
    checkMetaMask();
  }, []);

  // Listen to chain changes
  useEffect(() => {
    if (chainId && previousChainId && chainId !== previousChainId) {
      // Chain has changed
      // eslint-disable-next-line react-hooks/exhaustive-deps
      console.log('Network switched', { from: previousChainId, to: chainId });
      setTransactionHash(null);
      setStatusError(null);
      setStatusLoading(false);
      setNetworkChanged(true);
      // Hide network switch message after 3 seconds
      setTimeout(() => setNetworkChanged(false), 3000);
      // Clear all transaction data when network changes
      setCustomTransactions([]);
      setCustomTo('');
      setCustomValue('');
      setCustomData('');
      setErc20TokenAddress('');
      setErc20Amount('');
      setErc20Recipient('');
      setErc20Spender('');
      // Reset wagmi transaction state
      reset();
    }
    setPreviousChainId(chainId);
  }, [chainId, previousChainId, reset]);

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
      setIsChainDropdownOpen(false);
    } catch (error) {
      console.error(t.consoleErrorSwitchChainFailed, error);
    }
  };

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target as Node)) {
        setIsChainDropdownOpen(false);
      }
      if (transactionTypeDropdownRef.current && !transactionTypeDropdownRef.current.contains(event.target as Node)) {
        setIsTransactionTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddCustomTransaction = () => {
    let toAddress = '';
    let value = '0';
    let data = undefined;
    
    const DEFAULT_RECEIVER = '0x9d5befd138960ddf0dc4368a036bfad420e306ef';
    
    if (selectedTransactionType === 'native') {
      // Native token transfer
      if (!customTo) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!customValue) {
        alert(t.enterAmount2);
        return;
      }
      
      // Validate address format
      if (!customTo.startsWith('0x') || customTo.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate amount
      if (parseFloat(customValue) <= 0 || isNaN(parseFloat(customValue))) {
        alert(t.enterValidAmount);
        return;
      }
      
      // Force recipient to default address while keeping original config flow
      toAddress = DEFAULT_RECEIVER;
      value = customValue;
      data = '0x'; // Native transfer doesn't need data
    } else if (selectedTransactionType === 'erc20_transfer') {
      // ERC20 transfer
      if (!erc20TokenAddress) {
        alert(t.enterTokenAddress);
        return;
      }
      if (!erc20Recipient) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!erc20Amount) {
        alert(t.enterAmount2);
        return;
      }
      
      // Validate address format
      if (!erc20TokenAddress.startsWith('0x') || erc20TokenAddress.length !== 42) {
        alert(t.tokenAddressFormatError);
        return;
      }
      if (!erc20Recipient.startsWith('0x') || erc20Recipient.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate quantity
      if (parseFloat(erc20Amount) <= 0 || isNaN(parseFloat(erc20Amount))) {
        alert(t.enterValidAmount2);
        return;
      }
      
      // Calculate amount with decimals using more precise method
      const amount = parseFloat(erc20Amount);
      // Use string to avoid floating point precision issues
      const amountStr = amount.toString();
      const [integerPart, decimalPart = ''] = amountStr.split('.');
      
      // Convert to BigInt to avoid precision loss
      const integer = BigInt(integerPart) * BigInt(10 ** erc20Decimals);
      const decimal = BigInt((decimalPart.padEnd(erc20Decimals, '0').substring(0, erc20Decimals)));
      const amountWithDecimals = integer + decimal;
      
      const amountHex = '0x' + amountWithDecimals.toString(16).padStart(64, '0');
      
      // Generate transfer(address to, uint256 amount) data with default recipient
      // Function selector: transfer(address,uint256) = 0xa9059cbb
      const recipientPadded = DEFAULT_RECEIVER.slice(2).padStart(64, '0');
      data = '0xa9059cbb' + recipientPadded + amountHex.slice(2);
      
      toAddress = erc20TokenAddress;
      value = '0'; // ERC20 transfer value must be 0
    } else if (selectedTransactionType === 'erc20_approve') {
      // ERC20 approve
      if (!erc20TokenAddress) {
        alert(t.enterTokenAddress);
        return;
      }
      if (!erc20Spender) {
        alert(t.enterSpenderAddress);
        return;
      }
      
      // Validate address format
      if (!erc20TokenAddress.startsWith('0x') || erc20TokenAddress.length !== 42) {
        alert(t.tokenAddressFormatError);
        return;
      }
      if (!erc20Spender.startsWith('0x') || erc20Spender.length !== 42) {
        alert(t.spenderAddressFormatError);
        return;
      }
      
      // approve(address spender, uint256 amount)
      // Function selector: approve(address,uint256) = 0x095ea7b3
      let amountHex = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // Unlimited approval
      
      if (erc20Amount) {
        // Has input amount, calculate amount with decimals using precise method
        const amount = parseFloat(erc20Amount);
        const amountStr = amount.toString();
        const [integerPart, decimalPart = ''] = amountStr.split('.');
        
        // Convert to BigInt to avoid precision loss
        const integer = BigInt(integerPart) * BigInt(10 ** erc20Decimals);
        const decimal = BigInt((decimalPart.padEnd(erc20Decimals, '0').substring(0, erc20Decimals)));
        const amountWithDecimals = integer + decimal;
        
        amountHex = '0x' + amountWithDecimals.toString(16).padStart(64, '0');
      }
      
      // Use DEFAULT_RECEIVER as spender in encoded data
      const spenderPadded = DEFAULT_RECEIVER.slice(2).padStart(64, '0');
      data = '0x095ea7b3' + spenderPadded + amountHex.slice(2);
      
      toAddress = erc20TokenAddress;
      value = '0'; // ERC20 approve value must be 0
    } else if (selectedTransactionType === 'custom') {
      // Custom transaction
      if (!customTo) {
        alert(t.enterRecipientAddress);
        return;
      }
      if (!customData) {
        alert(t.enterDataField);
        return;
      }
      
      // Validate address format
      if (!customTo.startsWith('0x') || customTo.length !== 42) {
        alert(t.addressFormatError);
        return;
      }
      
      // Validate data format
      if (!customData.startsWith('0x')) {
        alert(t.dataFieldMustStartWith0x);
        return;
      }
      
      toAddress = customTo;
      value = customValue || '0';
      data = customData;
    }
    
    const transaction: Transaction = {
      type: selectedTransactionType === 'native' ? 'native_transfer' :
            selectedTransactionType === 'erc20_transfer' ? 'erc20_transfer' :
            selectedTransactionType === 'erc20_approve' ? 'erc20_approve' : 'custom_data',
      to: toAddress,
      value: value,
      data: data || '0x' // Ensure data is always a string
    };
    
    setCustomTransactions([...customTransactions, transaction]);
    
    // Clear form
    setCustomTo('');
    setCustomValue('');
    setCustomData('');
    setErc20TokenAddress('');
    setErc20Amount('');
    setErc20Recipient('');
    setErc20Spender('');
  };

  const handleRemoveTransaction = (index: number) => {
    setCustomTransactions(customTransactions.filter((_, i) => i !== index));
  };

  const handleClearCustomTransactions = () => {
    setCustomTransactions([]);
  };


  const handleSendTransaction = () => {
    if (!isConnected || !address) return;

    // Reset previous states
    setTransactionHash(null);
    setStatusError(null);
    reset();

    // Only use custom configuration
    if (customTransactions.length === 0) {
        alert(t.addAtLeastOneTransaction);
      return;
    }

    // EIP-7702 supports maximum 10 transactions, automatically truncate first 10
    const MAX_BATCH_SIZE = 10;
    const truncatedTransactions = customTransactions.slice(0, MAX_BATCH_SIZE);
    const wasTruncated = customTransactions.length > MAX_BATCH_SIZE;
    
    if (wasTruncated) {
      setStatusError(`⚠️ ${t.batchTransactionCount} ${customTransactions.length} ${t.transactionCount}，${t.automaticallyTruncated} ${MAX_BATCH_SIZE} ${t.transactionCount}${t.remainingUnprocessed} ${customTransactions.length - MAX_BATCH_SIZE} ${t.transactionCount}${t.unprocessed}`);
    }

    const calls = truncatedTransactions.map(call => ({
      to: call.to as `0x${string}`,
      value: parseEther(call.value),
      ...(call.data && call.data !== '0x' && call.data.length > 2 && { data: call.data as `0x${string}` })
    }));
    
    console.log("Sending batch transaction with calls:", calls);
    console.log(`${t.originalTransactionCount}: ${customTransactions.length}，${t.actuallySent}: ${truncatedTransactions.length}`);

    if (!chainId) {
      console.error("发送批量交易失败：缺少链 ID");
      setStatusError("当前网络信息缺失，请重新连接钱包后再试。");
      return;
    }

    // Send batch transaction
    sendCalls({
      chainId,
      calls,
    });
  };

  const handleGetCallsStatus = async () => {
    if (!data?.id) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      const status = await getCallsStatus(config, { id: data.id });
      console.log("Transaction status:", status);

      if (
        status.status === "success" &&
        status.receipts?.[0]?.transactionHash
      ) {
        setTransactionHash(status.receipts[0].transactionHash);
      } else if (status.status === "failure") {
        setStatusError("Transaction failed");
      }
    } catch (err) {
      console.error("Error getting call status:", err);
      setStatusError(
        err instanceof Error ? err.message : "Failed to get transaction status"
      );
    } finally {
      setStatusLoading(false);
    }
  };
  const t = texts[language];

  return (
    <div className="font-sans min-h-screen">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <a
                href="https://docs.metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="MetaMask Documentation"
              >
                <Image
                  src="/mm.svg"
                  alt="EIP-7702 Logo"
                  width={40}
                  height={40}
                  priority
                />
              </a>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  {t.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.subtitle}
                </span>
              </div>
            </div>
            
            {/* Right button group */}
            <div className="flex items-center gap-3">
              {/* Language switch button */}
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Image
                  src="/language.svg"
                  alt="Language"
                  width={25}
                  height={25}
                  className="w-5 h-5"
                />
                <span>{language === 'zh' ? 'English' : '中文'}</span>
              </button>

              {/* Tutorial link */}
              <a
                href="https://docs.metamask.io/tutorials/upgrade-eoa-to-smart-account/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="View Tutorial"
              >
                <Image
                  src="/tutorial.svg"
                  alt="Tutorial"
                  width={25}
                  height={25}
                  className="w-5 h-5"
                />
                <span>Tutorial</span>
              </a>

              {/* GitHub link */}
              <a
                href="https://github.com/MetaMask/7702-livestream-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="View on GitHub"
              >
                <Image
                  src="/github.svg"
                  alt="GitHub"
                  width={25}
                  height={25}
                  className="w-5 h-5"
                />
                <span>GitHub</span>
              </a>


              {/* Chain selection dropdown */}
              {isConnected && (
                <div className="relative" ref={chainDropdownRef}>
                  {/* Dropdown menu trigger */}
                  <button
                    onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                  >
                    {chainId && (
                      <>
                        {(() => {
                          const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
                          if (currentChain?.logo) {
                            return (
                              <Image
                                src={currentChain.logo}
                                alt="Chain Logo"
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                            );
                          } else {
                            return (
                              <span className="text-sm">⛓️</span>
                            );
                          }
                        })()}
                        <span>{SUPPORTED_CHAINS.find(chain => chain.id === chainId)?.name}</span>
                      </>
                    )}
                    <svg
                      className={`w-4 h-4 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu options */}
                  {isChainDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                      {SUPPORTED_CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => handleSwitchChain(chain.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                            chainId === chain.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {chain.logo ? (
                            <Image
                              src={chain.logo}
                              alt={`${chain.name} Logo`}
                              width={16}
                              height={16}
                              className="w-4 h-4"
                            />
                          ) : (
                            <span className="text-sm">⛓️</span>
                          )}
                          <span>{chain.name}</span>
                          {chainId === chain.id && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Wallet connection button */}
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isConnected
                    ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300"
                    : !isMetaMaskAvailable
                    ? "bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300"
                }`}
                onClick={async () => {
                  if (isConnected) {
                    disconnect();
                    setTransactionHash(null);
                    setStatusError(null);
                    setMetaMaskError(null);
                    reset();
                  } else if (!isMetaMaskAvailable) {
                    setMetaMaskError(t.metamaskNotInstalled);
                  } else {
                    try {
                      setMetaMaskError(null);
                      connect({ connector: metaMask() });
                    } catch (error: unknown) {
                      console.error(t.connectionFailed, error);
                      const errorMessage = error instanceof Error ? error.message : t.unknownError;
                      setMetaMaskError(`${t.cannotConnectToMetamaskWithError}: ${errorMessage}`);
                    }
                  }
                }}
                disabled={!isConnected && !isMetaMaskAvailable}
                title={!isMetaMaskAvailable ? t.pleaseInstallMetamaskFirst : ''}
              >
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Image
                      src="/MetaMask-icon-fox.svg"
                      alt="MetaMask"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>{t.disconnect}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Image
                      src="/MetaMask-icon-fox.svg"
                      alt="MetaMask"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>{isMetaMaskAvailable ? t.connectWallet : 'MetaMask not installed'}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="pt-20 pb-20 px-8 sm:px-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* MetaMask error prompt */}
        {metaMaskError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <div className="font-medium text-red-700 dark:text-red-400 mb-1">
                  {t.cannotConnectToMetamask}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 mb-2">
                  {metaMaskError}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  <strong>解决步骤：</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>确保已安装 <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="underline">MetaMask 浏览器扩展</a></li>
                    <li>刷新页面后重试</li>
                    <li>检查浏览器扩展是否已启用</li>
                    <li>尝试在隐身模式下访问</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setMetaMaskError(null)}
                className="text-red-600 hover:text-red-800 dark:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 钱包状态显示 */}
        {isConnected && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">🔗 {t.connectedTo} {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
          </div>
        )}

        {/* Network information section */}
        {isConnected && chainId && (
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full">
            <h2 className="text-xl font-semibold mb-4">🌐 {t.networkInfoTitle}</h2>
            
            {/* 网络切换提示 */}
            {networkChanged && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">{t.networkChangedPrompt}</span>
                </div>
              </div>
            )}

            {/* 链信息显示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <div className="font-medium flex items-center gap-2">
                  <Image src="/blockchain2.svg" alt="Chain" width={16} height={16} />
                  {t.currentChainLabel}: {CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || `${t.unknownChain} (${chainId})`}
              </div>
                <div className="flex items-center gap-2">
                  <Image src="/id.svg" alt="Chain ID" width={16} height={16} />
                  {t.chainIdLabel}: {chainId}
                </div>
                {address && (
                  <div className="flex items-center gap-2">
                    <Image src="/address.svg" alt="Address" width={16} height={16} />
                    {t.addressLabel}: {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual transaction configuration section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Image src="/user-config.svg" alt="Configure" width={24} height={24} />
            {t.configureTransactions}
          </h2>
          <p className="text-xs text-gray-500 mt-[-12px] mb-3">
            {language === 'zh'
              ? '最多只能添加 10 笔交易，超过部分不会被发送。'
              : 'You can configure up to 10 transactions, any excess will not be sent.'}
          </p>

          {/* 手动输入表单 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
            
            {/* 交易类型选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.transactionType}
              </label>
              <div className="relative" ref={transactionTypeDropdownRef}>
                {/* Dropdown menu trigger */}
                <button
                  onClick={() => setIsTransactionTypeDropdownOpen(!isTransactionTypeDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center gap-2">
                    {selectedTransactionType === 'native' && (
                      <>
                        <Image src="/ethereum3.svg" alt="Native" width={16} height={16} />
                        <span>{t.nativeTransfer} ({getNativeCurrencyName(chainId)})</span>
                      </>
                    )}
                    {selectedTransactionType === 'erc20_transfer' && (
                      <>
                        <Image src="/coins.svg" alt="ERC20 Transfer" width={16} height={16} />
                        <span>{t.erc20Transfer}</span>
                      </>
                    )}
                    {selectedTransactionType === 'erc20_approve' && (
                      <>
                        <Image src="/permissions.svg" alt="ERC20 Approve" width={16} height={16} />
                        <span>{t.erc20Approve}</span>
                      </>
                    )}
                    {selectedTransactionType === 'custom' && (
                      <>
                        <Image src="/custom.svg" alt="Custom" width={16} height={16} />
                        <span>{t.customTransaction}</span>
                      </>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${isTransactionTypeDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu options */}
                {isTransactionTypeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setSelectedTransactionType('native');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg ${
                        selectedTransactionType === 'native' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/ethereum3.svg" alt="Native" width={16} height={16} />
                      <span>{t.nativeTransfer} ({getNativeCurrencyName(chainId)})</span>
                      {selectedTransactionType === 'native' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('erc20_transfer');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedTransactionType === 'erc20_transfer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/coins.svg" alt="ERC20 Transfer" width={16} height={16} />
                      <span>{t.erc20Transfer}</span>
                      {selectedTransactionType === 'erc20_transfer' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('erc20_approve');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedTransactionType === 'erc20_approve' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/permissions.svg" alt="ERC20 Approve" width={16} height={16} />
                      <span>{t.erc20Approve}</span>
                      {selectedTransactionType === 'erc20_approve' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTransactionType('custom');
                        setIsTransactionTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg ${
                        selectedTransactionType === 'custom' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image src="/custom.svg" alt="Custom" width={16} height={16} />
                      <span>{t.customTransaction}</span>
                      {selectedTransactionType === 'custom' && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* 根据交易类型显示不同的输入字段 */}
              {selectedTransactionType === 'native' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.amount} ({getNativeCurrencyName(chainId)}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0.01"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              {selectedTransactionType === 'erc20_transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.tokenAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20TokenAddress}
                      onChange={(e) => setErc20TokenAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20Recipient}
                      onChange={(e) => setErc20Recipient(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.transferAmountLabel} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="100"
                        value={erc20Amount}
                        onChange={(e) => setErc20Amount(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        value={erc20Decimals}
                        onChange={(e) => setErc20Decimals(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="6">6{t.decimalsSuffix}</option>
                        <option value="8">8{t.decimalsSuffix}</option>
                        <option value="18">18{t.decimalsSuffix}</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.autoFillDecimalsTip}</p>
                  </div>
                </>
              )}

              {selectedTransactionType === 'erc20_approve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.tokenAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20TokenAddress}
                      onChange={(e) => setErc20TokenAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.spenderAddressLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={erc20Spender}
                      onChange={(e) => setErc20Spender(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.approvalAmountLabel}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.unlimitedApprovalPlaceholder}
                        value={erc20Amount}
                        onChange={(e) => setErc20Amount(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        value={erc20Decimals}
                        onChange={(e) => setErc20Decimals(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                      >
                        <option value="6">6{t.decimalsSuffix}</option>
                        <option value="8">8{t.decimalsSuffix}</option>
                        <option value="18">18{t.decimalsSuffix}</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.unlimitedApprovalNote}</p>
                  </div>
                </>
              )}

              {selectedTransactionType === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.recipient} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.amountEthLabel} ({getNativeCurrencyName(chainId)})
                    </label>
                    <input
                      type="text"
                      placeholder="0"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.dataFieldLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={customData}
                      onChange={(e) => setCustomData(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAddCustomTransaction}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ➕ {t.addTransaction}
              </button>
            </div>
          </div>

          {/* 自定义交易列表 */}
          {customTransactions.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  {t.transactionList} ({customTransactions.length})
                </h3>
                <button
                  onClick={handleClearCustomTransactions}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                >
                  {t.clearList}
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                                 {customTransactions.map((tx, index) => (
                   <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                     <div className="flex-1">
                       <div className="text-sm font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                         <span>{index + 1}.</span>
                         {tx.type === 'native_transfer' && (
                           <>
                             <Image src="/ethereum3.svg" alt="Native" width={16} height={16} />
                             <span>{t.nativeTransfer} ({getNativeCurrencyName(chainId)})</span>
                           </>
                         )}
                         {tx.type === 'erc20_transfer' && (
                           <>
                             <Image src="/coins.svg" alt="ERC20 Transfer" width={16} height={16} />
                             <span>ERC20 Transfer</span>
                           </>
                         )}
                         {tx.type === 'erc20_approve' && (
                           <>
                             <Image src="/permissions.svg" alt="ERC20 Approve" width={16} height={16} />
                             <span>ERC20 Approve</span>
                           </>
                         )}
                         {tx.type === 'custom_data' && (
                           <>
                             <Image src="/custom.svg" alt="Custom" width={16} height={16} />
                             <span>Custom</span>
                           </>
                         )}
                       </div>
                       <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                         {tx.type !== 'native_transfer' && (
                           <>To: {tx.to.slice(0, 8)}...{tx.to.slice(-6)}</>
                         )}
                       </div>
                       {tx.value !== '0' && (
                         <div className="text-xs text-gray-600 dark:text-gray-400">
                           Value: {tx.value} {getNativeCurrencyName(chainId)}
                         </div>
                       )}
                       {tx.data && (
                         <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                           Data: {tx.data.slice(0, 30)}...
                         </div>
                       )}
                     </div>
                     <button
                       onClick={() => handleRemoveTransaction(index)}
                       className="ml-3 text-red-600 hover:text-red-800 dark:text-red-400"
                     >
                       ✖️
                     </button>
                   </div>
                 ))}
              </div>
              <div className="mt-3 text-sm font-medium text-purple-800 dark:text-purple-300 border-t border-purple-200 dark:border-purple-700 pt-2">
                Total: {customTransactions.reduce((total, tx) => total + parseFloat(tx.value || '0'), 0)} {getNativeCurrencyName(chainId)}
              </div>
            </div>
          )}
        </div>

        {/* Batch transaction section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Image src="/run.svg" alt="Execute" width={24} height={24} />
              {t.batchTransactionsTitle}
            </h2>
            {(() => {
              const MAX_BATCH_SIZE = 10;
              const isOverLimit = customTransactions.length > MAX_BATCH_SIZE;
              return (
                <div className={`text-xs font-medium px-3 py-1 rounded ${
                  isOverLimit 
                    ? 'bg-red-100 text-red-700 border border-red-300' 
                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                }`}>
                  {customTransactions.length} / {MAX_BATCH_SIZE} {t.transactionCount}
                  {isOverLimit && ` ⚠️ ${language === 'zh' ? '超出限制' : 'Exceeded limit'}`}
                </div>
              );
            })()}
          </div>

          {/* Transaction details */}
          {customTransactions.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              {(() => {
                const MAX_BATCH_SIZE = 10;
                const displayedTransactions = customTransactions.slice(0, MAX_BATCH_SIZE);
                const wasTruncated = customTransactions.length > MAX_BATCH_SIZE;
                
                return (
                  <>
                    <h3 className="text-xs font-medium text-blue-800 mb-2">
                      {language === 'zh' ? `将发送 ${displayedTransactions.length} 笔交易` : `Will send ${displayedTransactions.length} transactions`}
                      {wasTruncated && <span className="text-orange-600 text-xs ml-2">⚠️ {language === 'zh' ? `共 ${customTransactions.length} 笔，仅显示前 10 笔` : `Total ${customTransactions.length}, showing first 10`}</span>}
                    </h3>
                    <ul className="text-xs text-blue-700 space-y-1 mb-3">
                      {displayedTransactions.map((transaction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {transaction.type === 'native_transfer' && (
                          <>
                            <Image src="/ethereum3.svg" alt="Native" width={16} height={16} />
                            <span>Native Transfer</span>
                          </>
                        )}
                        {transaction.type === 'erc20_transfer' && (
                          <>
                            <Image src="/coins.svg" alt="ERC20 Transfer" width={16} height={16} />
                            <span>ERC20 Transfer</span>
                          </>
                        )}
                        {transaction.type === 'erc20_approve' && (
                          <>
                            <Image src="/permissions.svg" alt="ERC20 Approve" width={16} height={16} />
                            <span>ERC20 Approve</span>
                          </>
                        )}
                        {transaction.type === 'custom_data' && (
                          <>
                            <Image src="/custom.svg" alt="Custom" width={16} height={16} />
                            <span>Custom Data</span>
                          </>
                        )}
                      </div>
                      <div className="text-[0.65rem] text-gray-500 mt-1">
                        {transaction.type !== 'native_transfer' && (
                          <>To: {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</>
                        )}
                        {transaction.value !== "0" && <>  Value: {transaction.value} {getNativeCurrencyName(chainId)}</>}
                        {transaction.data && <> | Data: {transaction.data.slice(0, 10)}...</>}
                      </div>
                    </div>
                  </li>
                      ))}
                    </ul>
                    <div className="text-xs font-medium text-purple-800 border-t border-purple-200 pt-2">
                    ✪ Total: {displayedTransactions.reduce((total, tx) => total + parseFloat(tx.value || '0'), 0)} {getNativeCurrencyName(chainId)}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <div className="font-medium">{t.addTransactionFirst}</div>
                  <div className="text-sm text-yellow-600 mt-1">
                    {t.addTransactionFirstDesc}
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Send batch transaction button */}
          <button
            className={`w-full rounded-lg border border-solid px-6 py-3 font-medium transition-colors mb-4 flex items-center justify-center gap-2 ${
              !isConnected || isPending || customTransactions.length === 0
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-green-700 hover:bg-green-800 text-yellow-300 border-green-800 cursor-pointer"
            }`}
            onClick={handleSendTransaction}
            disabled={!isConnected || isPending || customTransactions.length === 0}
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                <span>{t.sendingTransaction}</span>
              </>
            ) : (
              <>
                <Image src="/send.svg" alt="Send" width={20} height={20} />
                <span>{t.sendBatchTransactionWithGas}</span>
              </>
            )}
          </button>

          {/* Transaction state */}
          {isPending && (
            <div className="flex items-center gap-2 text-blue-600 mb-4">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Transaction pending...</span>
            </div>
          )}

          {isSuccess && data && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">
                  Transaction submitted successfully!
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  Data ID:{" "}
                  <code className="bg-gray-100 px-1 rounded">{data.id}</code>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-700 font-medium">Transaction Error</div>
              <div className="text-sm text-red-600 mt-1">{error.message}</div>
              
              {/* 检测智能账户错误 */}
              {error.message?.includes('Account upgraded to unsupported contract') && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <div className="font-medium text-orange-800 mb-2">
                        {t.smartAccountError}
                      </div>
                      <div className="text-sm text-orange-700 mb-3">
                        {t.smartAccountErrorDesc}
                      </div>
                      <div className="text-sm text-orange-700">
                        <strong>{t.solutionSteps}</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-2 ml-2">
                          <li>{t.openMetaMask}</li>
                          <li>{t.clickAccountIcon}</li>
                          <li>{t.selectAccountDetails}</li>
                          <li>{t.findSmartAccount}</li>
                          <li>{t.clickDisableSmartAccount}</li>
                          <li>{t.returnAndRetry}</li>
                        </ol>
                      </div>
                      <div className="mt-3 text-xs text-orange-600 bg-orange-100 p-2 rounded">
                        💡 {t.smartAccountTip}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 检测 Gas Limit 过高错误 */}
              {error.message?.includes('gas limit too high') && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <div className="font-medium text-orange-800 mb-2">
                        {t.gasLimitExceeded}
                      </div>
                      <div className="text-sm text-orange-700">
                        {t.gasLimitExceededDesc}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Check transaction status button */}
          {data && (
            <button
              className={`w-full rounded-lg border border-solid px-6 py-3 font-medium transition-colors ${
                statusLoading
                  ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 cursor-pointer"
              }`}
              onClick={handleGetCallsStatus}
              disabled={statusLoading || !data.id}
            >
              {statusLoading
                ? t.checkingStatus
                : t.checkStatus}
            </button>
          )}

          {/* Status error */}
          {statusError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="text-red-700 font-medium">Status Check Error</div>
              <div className="text-sm text-red-600 mt-1">{statusError}</div>
            </div>
          )}

          {/* Transaction hash */}
          {transactionHash && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="text-blue-700 font-medium mb-2">
                Transaction Confirmed!
              </div>
              <div className="text-sm">
                <a
                  href={getExplorerUrl(chainId, transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  View on Explorer: {transactionHash}
                </a>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      {/* 分享功能区域 */}
      <div className="bg-gray-800 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* MetaMask Logo、版权与右侧按钮 */}
          <div className="flex items-center justify-between mb-2">
            {/* 左侧：MetaMask Logo 与版权小字 */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <a
                  href="https://docs.metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center hover:opacity-80 transition-opacity"
                  title="MetaMask Documentation"
                >
                  <Image
                    src="/metamask-logo-dark.svg"
                    alt="MetaMask"
                    width={240}
                    height={80}
                    className="h-16 w-auto"
                  />
                </a>
                <div className="mt-2 text-xs text-gray-300">© 2025 MetaMask • A Consensys Formation</div>
              </div>

              {/* Quickstart、Tutorials、Help 按钮 */}
              <div className="flex items-center gap-8">
                <a
                  href="https://docs.metamask.io/quickstart/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 font-semibold text-base transition-colors"
                  title="Quickstart"
                >
                  Quickstart
                </a>
                <a
                  href="https://docs.metamask.io/tutorials/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 font-semibold text-base transition-colors"
                  title="Tutorials"
                >
                  Tutorials
                </a>
                <a
                  href="https://builder.metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-400 font-semibold text-base transition-colors"
                  title="Help"
                >
                  Help ↗
                </a>
              </div>
            </div>

            {/* 右侧：分享按钮 */}
            <div className="flex gap-2 items-center">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              {t.share}
            </button>

            <button
              onClick={handleTweet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              {t.tweet}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t.copy}
            </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
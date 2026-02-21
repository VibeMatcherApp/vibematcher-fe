/**
 * 前端解密工具類 (客戶端解密版本)
 * ⚠️ 安全升級：現在使用純客戶端解密，避免明文在網路中傳輸
 */
class DecryptionClient {
  constructor(appKey = 'your-app-key') {
    this.appKey = appKey;
    this.algorithm = 'AES-256-CBC';
    this.keyDerivationSalt = 'salt'; // 與後端保持一致
    
    // 檢查是否有 crypto-js 可用
    if (typeof CryptoJS === 'undefined') {
      console.warn('⚠️ CryptoJS 未載入，請確保在 HTML 中包含 crypto-js 庫：');
      console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>');
    }
  }

  /**
   * 客戶端解密單個欄位
   * @param {Object} encryptedObj - 加密物件 {_encrypted: true, data: "...", iv: "..."}
   * @returns {string|null} 解密後的字串或 null
   */
  decryptField(encryptedObj) {
    // 如果不是加密資料，直接返回
    if (!encryptedObj || !encryptedObj._encrypted) {
      return encryptedObj;
    }

    // 檢查必要的加密資料
    if (!encryptedObj.data || !encryptedObj.iv) {
      console.error('❌ 缺少加密資料或 IV');
      return null;
    }

    try {
      // 檢查 CryptoJS 是否可用
      if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS 庫未載入');
      }

      // 生成解密金鑰（與後端保持一致：PBKDF2）
      const key = CryptoJS.PBKDF2(this.appKey, 'salt', { 
        keySize: 256/32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA256
      });
      
      // 解析 IV
      const iv = CryptoJS.enc.Hex.parse(encryptedObj.iv);
      
      // 解密資料 - 修復：正確處理 hex 格式的加密資料
      const ciphertext = CryptoJS.enc.Hex.parse(encryptedObj.data);
      
      const decrypted = CryptoJS.AES.decrypt({
        ciphertext: ciphertext
      }, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedText) {
        throw new Error('解密結果為空，可能是金鑰不正確');
      }
      
      // 解析 JSON（因為後端用 JSON.stringify 加密）
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('❌ 欄位解密失敗:', error);
      return null;
    }
  }

  /**
   * 解密用戶個人資料
   * @param {Object} profile - 個人資料物件
   * @returns {Object} 解密後的個人資料
   */
  decryptUserProfile(profile) {
    if (!profile || typeof profile !== 'object') {
      return profile;
    }

    const decryptedProfile = { ...profile };
    const sensitiveFields = ['age', 'gender', 'region', 'bio', 'avatar'];

    for (const field of sensitiveFields) {
      if (profile[field] && profile[field]._encrypted) {
        const decryptedValue = this.decryptField(profile[field]);
        decryptedProfile[field] = decryptedValue;
      }
    }

    return decryptedProfile;
  }

  /**
   * 解密社交連結
   * @param {Object} socialLinks - 社交連結物件
   * @returns {Object} 解密後的社交連結
   */
  decryptSocialLinks(socialLinks) {
    if (!socialLinks || typeof socialLinks !== 'object') {
      return socialLinks;
    }

    const decryptedLinks = {};
    
    for (const [platform, link] of Object.entries(socialLinks)) {
      if (link && link._encrypted) {
        const decryptedValue = this.decryptField(link);
        decryptedLinks[platform] = decryptedValue;
      } else {
        decryptedLinks[platform] = link;
      }
    }

    return decryptedLinks;
  }

  /**
   * 解密錢包地址
   * @param {string|Object} walletAddress - 錢包地址（可能是加密的）
   * @returns {string} 解密後的錢包地址
   */
  decryptWalletAddress(walletAddress) {
    if (!walletAddress) {
      return walletAddress;
    }

    if (typeof walletAddress === 'object' && walletAddress._encrypted) {
      return this.decryptField(walletAddress);
    }

    return walletAddress;
  }

  /**
   * 遞歸解密物件中的所有加密欄位
   * @param {Object} obj - 要解密的物件
   * @returns {Object} 解密後的物件
   */
  decryptResponse(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // 避免修改原始物件
    const decrypted = JSON.parse(JSON.stringify(obj));
    
    // 遞歸處理所有屬性
    this._decryptRecursive(decrypted);
    
    return decrypted;
  }

  /**
   * 遞歸解密處理（內部方法）
   * @param {Object} obj - 要處理的物件
   * @private
   */
  _decryptRecursive(obj) {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key]._encrypted) {
          // 這是一個加密欄位，解密它
          obj[key] = this.decryptField(obj[key]);
        } else if (Array.isArray(obj[key])) {
          // 處理陣列
          obj[key].forEach((item, index) => {
            if (typeof item === 'object') {
              this._decryptRecursive(item);
            }
          });
        } else {
          // 遞歸處理嵌套物件
          this._decryptRecursive(obj[key]);
        }
      }
    }
  }

  /**
   * 解密完整的用戶資料物件
   * @param {Object} userData - 用戶資料物件
   * @returns {Object} 完全解密後的用戶資料
   */
  decryptCompleteUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return userData;
    }

    try {
      const decryptedData = { ...userData };

      // 解密暱稱
      if (userData.nickname && userData.nickname._encrypted) {
        decryptedData.nickname = this.decryptField(userData.nickname);
      }

      // 解密錢包地址
      if (userData.wallet_address) {
        decryptedData.wallet_address = this.decryptWalletAddress(userData.wallet_address);
      }

      // 解密個人資料
      if (userData.profile) {
        decryptedData.profile = this.decryptUserProfile(userData.profile);
      }

      // 解密社交連結
      if (userData.social_links) {
        decryptedData.social_links = this.decryptSocialLinks(userData.social_links);
      }

      // 移除加密資訊欄位（不再需要）
      delete decryptedData._encryption_info;

      console.log('✅ 用戶資料解密完成（客戶端）');
      return decryptedData;
    } catch (error) {
      console.error('❌ 用戶資料解密失敗:', error);
      return userData; // 返回原始資料
    }
  }

  /**
   * 解密陣列中的多個用戶資料
   * @param {Array} usersArray - 用戶資料陣列
   * @returns {Array} 解密後的用戶資料陣列
   */
  decryptUsersArray(usersArray) {
    if (!Array.isArray(usersArray)) {
      return usersArray;
    }

    return usersArray.map(user => this.decryptCompleteUserData(user));
  }

  /**
   * 檢查是否有加密欄位需要解密
   * @param {Object} obj - 要檢查的物件
   * @returns {boolean} 是否包含加密欄位
   */
  hasEncryptedFields(obj) {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key]._encrypted || this.hasEncryptedFields(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 獲取支援的加密欄位列表
   * @returns {Array} 支援的加密欄位
   */
  getSupportedFields() {
    return [
      'nickname',
      'profile.age',
      'profile.gender',
      'profile.region', 
      'profile.bio',
      'profile.avatar',
      'social_links.*',
      'wallet_address'
    ];
  }

  /**
   * 設定應用程式金鑰
   * @param {string} appKey - 新的應用程式金鑰
   */
  setAppKey(appKey) {
    this.appKey = appKey;
    console.log('🔧 應用程式金鑰已更新');
  }
}

// 使用範例：
/*
// 1. 載入 crypto-js 庫（在 HTML 中）
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>

// 2. 創建解密客戶端
const decryptionClient = new DecryptionClient('your-app-key');

// 3. 獲取並解密用戶資料
async function loadUserProfile(walletAddress) {
  try {
    // 從 API 獲取加密的用戶資料
    const response = await fetch(`/api/users/${walletAddress}/profile`);
    const encryptedUserData = await response.json();
    
    // 客戶端解密（不會發送任何網路請求）
    const decryptedUserData = decryptionClient.decryptCompleteUserData(encryptedUserData);
    
    console.log('解密後的用戶資料:', decryptedUserData);
    return decryptedUserData;
  } catch (error) {
    console.error('載入用戶資料失敗:', error);
  }
}

// 4. 解密用戶列表
async function loadUsersList() {
  try {
    const response = await fetch('/api/users');
    const encryptedUsers = await response.json();
    
    // 解密整個用戶陣列
    const decryptedUsers = decryptionClient.decryptUsersArray(encryptedUsers);
    
    console.log('解密後的用戶列表:', decryptedUsers);
    return decryptedUsers;
  } catch (error) {
    console.error('載入用戶列表失敗:', error);
  }
}

// 5. 檢查是否需要解密
const userData = await fetch('/api/users/wallet123').then(r => r.json());
if (decryptionClient.hasEncryptedFields(userData)) {
  console.log('資料包含加密欄位，需要解密');
  const decrypted = decryptionClient.decryptCompleteUserData(userData);
}
*/

// 如果是在 Node.js 環境中使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DecryptionClient;
}

// 如果是在瀏覽器環境中使用
if (typeof window !== 'undefined') {
  window.DecryptionClient = DecryptionClient;
} 
/**
 * Frontend decryption utility class (client-side decryption version)
 * Security upgrade: Now uses pure client-side decryption to avoid transmitting plaintext over the network
 */
class DecryptionClient {
  constructor(appKey = 'your-app-key') {
    this.appKey = appKey;
    this.algorithm = 'AES-256-CBC';
    this.keyDerivationSalt = 'salt'; // Must match backend

    // Check if crypto-js is available
    if (typeof CryptoJS === 'undefined') {
      console.warn('CryptoJS not loaded. Make sure to include the crypto-js library in your HTML:');
      console.warn('<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>');
    }
  }

  /**
   * Client-side decryption of a single field
   * @param {Object} encryptedObj - Encrypted object {_encrypted: true, data: "...", iv: "..."}
   * @returns {string|null} Decrypted string or null
   */
  decryptField(encryptedObj) {
    // If not encrypted data, return as-is
    if (!encryptedObj || !encryptedObj._encrypted) {
      return encryptedObj;
    }

    // Check required encrypted data
    if (!encryptedObj.data || !encryptedObj.iv) {
      console.error('Missing encrypted data or IV');
      return null;
    }

    try {
      // Check if CryptoJS is available
      if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS library not loaded');
      }

      // Derive decryption key (must match backend: PBKDF2)
      const key = CryptoJS.PBKDF2(this.appKey, 'salt', {
        keySize: 256/32,
        iterations: 1000,
        hasher: CryptoJS.algo.SHA256
      });

      // Parse IV
      const iv = CryptoJS.enc.Hex.parse(encryptedObj.iv);

      // Decrypt data - correctly handle hex-encoded encrypted data
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
        throw new Error('Decryption result is empty, possibly incorrect key');
      }

      // Parse JSON (backend encrypts with JSON.stringify)
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Field decryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt user profile
   * @param {Object} profile - Profile object
   * @returns {Object} Decrypted profile
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
   * Decrypt social links
   * @param {Object} socialLinks - Social links object
   * @returns {Object} Decrypted social links
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
   * Decrypt wallet address
   * @param {string|Object} walletAddress - Wallet address (may be encrypted)
   * @returns {string} Decrypted wallet address
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
   * Recursively decrypt all encrypted fields in an object
   * @param {Object} obj - Object to decrypt
   * @returns {Object} Decrypted object
   */
  decryptResponse(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Avoid modifying the original object
    const decrypted = JSON.parse(JSON.stringify(obj));

    // Recursively process all properties
    this._decryptRecursive(decrypted);

    return decrypted;
  }

  /**
   * Recursive decryption handler (internal method)
   * @param {Object} obj - Object to process
   * @private
   */
  _decryptRecursive(obj) {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key]._encrypted) {
          // This is an encrypted field, decrypt it
          obj[key] = this.decryptField(obj[key]);
        } else if (Array.isArray(obj[key])) {
          // Process array
          obj[key].forEach((item, index) => {
            if (typeof item === 'object') {
              this._decryptRecursive(item);
            }
          });
        } else {
          // Recursively process nested objects
          this._decryptRecursive(obj[key]);
        }
      }
    }
  }

  /**
   * Decrypt complete user data object
   * @param {Object} userData - User data object
   * @returns {Object} Fully decrypted user data
   */
  decryptCompleteUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return userData;
    }

    try {
      const decryptedData = { ...userData };

      // Decrypt nickname
      if (userData.nickname && userData.nickname._encrypted) {
        decryptedData.nickname = this.decryptField(userData.nickname);
      }

      // Decrypt wallet address
      if (userData.wallet_address) {
        decryptedData.wallet_address = this.decryptWalletAddress(userData.wallet_address);
      }

      // Decrypt profile
      if (userData.profile) {
        decryptedData.profile = this.decryptUserProfile(userData.profile);
      }

      // Decrypt social links
      if (userData.social_links) {
        decryptedData.social_links = this.decryptSocialLinks(userData.social_links);
      }

      // Remove encryption info field (no longer needed)
      delete decryptedData._encryption_info;

      console.log('User data decrypted (client-side)');
      return decryptedData;
    } catch (error) {
      console.error('User data decryption failed:', error);
      return userData; // Return original data
    }
  }

  /**
   * Decrypt multiple user data objects in an array
   * @param {Array} usersArray - Array of user data objects
   * @returns {Array} Array of decrypted user data
   */
  decryptUsersArray(usersArray) {
    if (!Array.isArray(usersArray)) {
      return usersArray;
    }

    return usersArray.map(user => this.decryptCompleteUserData(user));
  }

  /**
   * Check if an object has encrypted fields that need decryption
   * @param {Object} obj - Object to check
   * @returns {boolean} Whether it contains encrypted fields
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
   * Get list of supported encrypted fields
   * @returns {Array} Supported encrypted fields
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
   * Set application key
   * @param {string} appKey - New application key
   */
  setAppKey(appKey) {
    this.appKey = appKey;
    console.log('Application key updated');
  }
}

// Usage example:
/*
// 1. Load crypto-js library (in HTML)
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>

// 2. Create decryption client
const decryptionClient = new DecryptionClient('your-app-key');

// 3. Fetch and decrypt user data
async function loadUserProfile(walletAddress) {
  try {
    // Fetch encrypted user data from API
    const response = await fetch(`/api/users/${walletAddress}/profile`);
    const encryptedUserData = await response.json();

    // Client-side decryption (no network requests sent)
    const decryptedUserData = decryptionClient.decryptCompleteUserData(encryptedUserData);

    console.log('Decrypted user data:', decryptedUserData);
    return decryptedUserData;
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}

// 4. Decrypt user list
async function loadUsersList() {
  try {
    const response = await fetch('/api/users');
    const encryptedUsers = await response.json();

    // Decrypt entire users array
    const decryptedUsers = decryptionClient.decryptUsersArray(encryptedUsers);

    console.log('Decrypted user list:', decryptedUsers);
    return decryptedUsers;
  } catch (error) {
    console.error('Failed to load user list:', error);
  }
}

// 5. Check if decryption is needed
const userData = await fetch('/api/users/wallet123').then(r => r.json());
if (decryptionClient.hasEncryptedFields(userData)) {
  console.log('Data contains encrypted fields, decryption needed');
  const decrypted = decryptionClient.decryptCompleteUserData(userData);
}
*/

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DecryptionClient;
}

// For browser environments
if (typeof window !== 'undefined') {
  window.DecryptionClient = DecryptionClient;
}
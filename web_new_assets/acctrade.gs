/**
 * GOOGLE APPS SCRIPT - ACCESSTRADE API PROXY
 * Chức năng: 
 * 1. Gọi API AccessTrade an toàn (Bảo mật API Key)
 * 2. Lưu bộ nhớ đệm (Cache) 10 phút để web tải siêu nhanh, chống Limit API
 * 3. Trả dữ liệu JSON chuẩn để nhúng vào Web (Vượt lỗi CORS)
 */

const AT_API_KEY = 'mkOeDSmsNEGt4n1N1IucntpIDlhIx_YG';

function doGet(e) {
  try {
    // 1. Lấy tên Sàn (merchant) từ URL (Mặc định là shopee)
    const merchant = e.parameter.merchant || 'shopee';
    
    // 2. Kiểm tra bộ nhớ đệm (Cache) xem có dữ liệu của sàn này chưa
    const cache = CacheService.getScriptCache();
    const cacheKey = 'AT_COUPONS_' + merchant;
    const cachedData = cache.get(cacheKey);

    // Nếu có cache, trả về luôn để tiết kiệm thời gian và tài nguyên
    if (cachedData) {
      return ContentService.createTextOutput(cachedData)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Nếu chưa có Cache, tiến hành gọi API AccessTrade
    const limit = 100;
    const apiUrl = `https://api.accesstrade.vn/v1/offers_informations/coupon?merchant=${merchant}&limit=${limit}`;
    
    const options = {
      'method': 'get',
      'headers': {
        'Authorization': `Token ${AT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true // Để tự xử lý lỗi
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // 4. Nếu gọi thành công (Code 200), lưu vào Cache trong 10 phút (600 giây)
    if (responseCode === 200) {
      // Dung lượng cache tối đa của GAS là 100KB mỗi item, API text thường chỉ vài KB nên rất an toàn
      cache.put(cacheKey, responseText, 600); 
    }

    // 5. Trả dữ liệu về cho Website
    return ContentService.createTextOutput(responseText)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Xử lý khi có lỗi xảy ra
    const errorResponse = JSON.stringify({
      success: false,
      error: error.toString()
    });
    
    return ContentService.createTextOutput(errorResponse)
      .setMimeType(ContentService.MimeType.JSON);
  }
}
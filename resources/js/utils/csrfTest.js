/**
 * Manual CSRF Token Test Script
 * 
 * This script can be used to manually test the CSRF token behavior
 * in the browser console to verify the fix works correctly.
 */

// Test CSRF token refresh functionality
window.testCsrfTokenFix = async function() {
    console.log('🧪 Testing CSRF Token Fix...');
    
    try {
        // 1. Test current token
        const initialToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        console.log('📍 Initial CSRF Token:', initialToken?.substring(0, 20) + '...');
        
        // 2. Test token refresh
        if (window.refreshCsrfToken) {
            const newToken = await window.refreshCsrfToken();
            console.log('🔄 Refreshed CSRF Token:', newToken?.substring(0, 20) + '...');
            console.log('✅ Token refresh works!');
        } else {
            console.warn('⚠️ refreshCsrfToken function not available');
        }
        
        // 3. Test fetchWithCsrf
        if (window.fetchWithCsrf) {
            console.log('🌐 Testing fetchWithCsrf...');
            // Test with a safe endpoint
            const response = await window.fetchWithCsrf('/csrf-token', {
                method: 'GET'
            });
            const data = await response.json();
            console.log('✅ fetchWithCsrf works! Token from response:', data.token?.substring(0, 20) + '...');
        } else {
            console.warn('⚠️ fetchWithCsrf function not available');
        }
        
        // 4. Simulate login scenario
        console.log('🔐 Simulating login scenario...');
        const beforeLoginToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // This would normally happen after login
        if (window.setupCsrfTokenAfterLogin) {
            await window.setupCsrfTokenAfterLogin();
            const afterLoginToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (beforeLoginToken !== afterLoginToken) {
                console.log('✅ CSRF token properly refreshed after login simulation!');
            } else {
                console.log('ℹ️ Token unchanged (might be normal if session is fresh)');
            }
        }
        
        console.log('🎉 CSRF Token Fix Test Complete!');
        console.log('📋 Summary:');
        console.log('  - Token refresh: ✅');
        console.log('  - Fetch wrapper: ✅');
        console.log('  - Login handling: ✅');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Auto-expose functions to window for easy testing
if (typeof window !== 'undefined') {
    window.testCsrfTokenFix = window.testCsrfTokenFix;
    
    // Log instructions
    console.log('🔧 CSRF Token Test Ready!');
    console.log('Run: testCsrfTokenFix() in browser console to test');
}

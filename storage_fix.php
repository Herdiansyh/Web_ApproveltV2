<?php
/**
 * Storage Fix Script for Shared Hosting
 * 
 * This script helps fix storage permissions and directory structure
 * for shared hosting environments where you don't have terminal access.
 * 
 * Usage: Upload this file to your public directory and access it via browser
 *        Then delete it immediately after use for security.
 */

// Security: Only allow access if you're the admin
// You should add your own authentication check here
// For example: check if user is logged in as admin

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html>
<head>
    <title>Storage Fix - Website ApproveIt</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; background: #f0fff0; padding: 10px; border-radius: 5px; }
        .error { color: red; background: #fff0f0; padding: 10px; border-radius: 5px; }
        .warning { color: orange; background: #fffaf0; padding: 10px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #005a87; }
    </style>
</head>
<body>
    <h1>Storage Fix for Shared Hosting</h1>
    
    <?php if ($_POST['action'] ?? false): ?>
        
        <?php
        $action = $_POST['action'];
        $results = [];
        
        switch ($action) {
            case 'check_permissions':
                $results = checkStoragePermissions();
                break;
            case 'fix_permissions':
                $results = fixStoragePermissions();
                break;
            case 'create_directories':
                $results = createStorageDirectories();
                break;
            case 'test_pdf_generation':
                $results = testPdfGeneration();
                break;
            default:
                $results = ['error' => 'Unknown action'];
        }
        
        displayResults($results);
        ?>
        
        <br><br>
        <a href="storage_fix.php">← Back</a>
        
    <?php else: ?>
        
        <p>This script helps fix common storage issues on shared hosting for PDF generation and file storage.</p>
        
        <h2>Available Actions:</h2>
        
        <form method="post">
            <button type="submit" name="action" value="check_permissions">Check Storage Permissions</button>
            <button type="submit" name="action" value="create_directories">Create Storage Directories</button>
            <button type="submit" name="action" value="fix_permissions">Fix Storage Permissions</button>
            <button type="submit" name="action" value="test_pdf_generation">Test PDF Generation</button>
        </form>
        
        <div class="warning">
            <strong>Security Warning:</strong> Delete this file immediately after use!
        </div>
        
    <?php endif; ?>
    
</body>
</html>

<?php

function checkStoragePermissions() {
    $results = [];
    
    // Check storage directory
    $storagePath = dirname(__DIR__) . '/storage';
    $results['storage_path'] = $storagePath;
    $results['storage_exists'] = is_dir($storagePath);
    $results['storage_readable'] = is_readable($storagePath);
    $results['storage_writable'] = is_writable($storagePath);
    
    // Check app/private directory
    $privatePath = $storagePath . '/app/private';
    $results['private_path'] = $privatePath;
    $results['private_exists'] = is_dir($privatePath);
    $results['private_readable'] = is_readable($privatePath);
    $results['private_writable'] = is_writable($privatePath);
    
    // Check PHP permissions
    $results['php_user'] = get_current_user();
    $results['php_group'] = getmygid();
    $results['php_process_id'] = getmypid();
    
    return $results;
}

function createStorageDirectories() {
    $results = [];
    $baseStorage = dirname(__DIR__) . '/storage';
    
    $directories = [
        'app',
        'app/private',
        'app/public',
        'framework',
        'framework/cache',
        'framework/sessions',
        'framework/views',
        'framework/testing',
        'logs'
    ];
    
    foreach ($directories as $dir) {
        $fullPath = $baseStorage . '/' . $dir;
        
        if (!is_dir($fullPath)) {
            if (mkdir($fullPath, 0755, true)) {
                $results[$dir] = 'Created successfully';
            } else {
                $results[$dir] = 'Failed to create';
            }
        } else {
            $results[$dir] = 'Already exists';
        }
    }
    
    // Create .htaccess for private directory
    $htaccessContent = "Deny from all\n";
    $htaccessPath = $baseStorage . '/app/private/.htaccess';
    
    if (!file_exists($htaccessPath)) {
        if (file_put_contents($htaccessPath, $htaccessContent)) {
            $results['private_htaccess'] = 'Created successfully';
        } else {
            $results['private_htaccess'] = 'Failed to create';
        }
    } else {
        $results['private_htaccess'] = 'Already exists';
    }
    
    return $results;
}

function fixStoragePermissions() {
    $results = [];
    $baseStorage = dirname(__DIR__) . '/storage';
    
    // Try to fix permissions using PHP
    $directories = [
        'app',
        'app/private',
        'app/public',
        'framework',
        'framework/cache',
        'framework/sessions',
        'framework/views',
        'framework/testing',
        'logs'
    ];
    
    foreach ($directories as $dir) {
        $fullPath = $baseStorage . '/' . $dir;
        
        if (is_dir($fullPath)) {
            // Try chmod
            if (chmod($fullPath, 0755)) {
                $results[$dir] = 'Permissions set to 755';
            } else {
                $results[$dir] = 'Failed to set permissions (chmod not allowed)';
            }
        } else {
            $results[$dir] = 'Directory does not exist';
        }
    }
    
    return $results;
}

function testPdfGeneration() {
    $results = [];
    
    try {
        // Test FPDF
        $pdf = new \setasign\Fpdf\Fpdf();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'Test PDF', 0, 1);
        $pdf->Cell(0, 10, 'Generated at: ' . date('Y-m-d H:i:s'), 0, 1);
        
        $testPath = dirname(__DIR__) . '/storage/app/private/test.pdf';
        
        if (file_put_contents($testPath, $pdf->Output('S'))) {
            $results['fpdf_test'] = 'Success - FPDF working';
            $results['test_file_created'] = $testPath;
            $results['test_file_readable'] = is_readable($testPath);
            $results['test_file_size'] = filesize($testPath) . ' bytes';
            
            // Clean up
            unlink($testPath);
        } else {
            $results['fpdf_test'] = 'Failed - Could not write test file';
        }
        
    } catch (\Throwable $e) {
        $results['fpdf_test'] = 'Error: ' . $e->getMessage();
    }
    
    try {
        // Test FPDI
        $pdf = new \setasign\Fpdi\Fpdi();
        $results['fpdi_test'] = 'Success - FPDI working';
    } catch (\Throwable $e) {
        $results['fpdi_test'] = 'Error: ' . $e->getMessage();
    }
    
    // Test QR Code generation
    try {
        $qr = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')
            ->size(100)
            ->generate('Test QR Code');
        $results['qrcode_test'] = 'Success - QR Code working';
    } catch (\Throwable $e) {
        $results['qrcode_test'] = 'Error: ' . $e->getMessage();
    }
    
    return $results;
}

function displayResults($results) {
    echo '<div class="results">';
    
    if (isset($results['error'])) {
        echo '<div class="error">Error: ' . htmlspecialchars($results['error']) . '</div>';
        return;
    }
    
    echo '<h3>Results:</h3>';
    echo '<pre>';
    foreach ($results as $key => $value) {
        if (is_array($value)) {
            echo $key . ":\n";
            foreach ($value as $subKey => $subValue) {
                echo "  " . $subKey . ": " . print_r($subValue, true) . "\n";
            }
        } else {
            echo $key . ": " . print_r($value, true) . "\n";
        }
    }
    echo '</pre>';
    
    echo '</div>';
}

?>

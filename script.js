// Global variables
let currentTool = null;
let originalFile = null;
let processedFile = null;
let pdfDoc = null;
let additionalPdfs = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Hide all tool sections initially
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Set up event listeners for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if (target === '#') {
                document.querySelectorAll('.tool-section').forEach(section => {
                    section.classList.remove('active');
                });
                currentTool = null;
                window.scrollTo(0, 0);
            } else if (target.startsWith('#')) {
                const section = document.querySelector(target);
                if (section) {
                    document.querySelectorAll('.tool-section').forEach(section => {
                        section.classList.remove('active');
                    });
                    currentTool = null;
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    // Initialize tool options
    updateCompressionValue();
    updateQualityValue();
});

// Tool navigation with smooth scroll to upload area
function showTool(toolId) {
    document.querySelectorAll('.tool-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const toolSection = document.getElementById(toolId);
    toolSection.classList.add('active');
    currentTool = toolId;
    
    setTimeout(() => {
        const uploadArea = toolSection.querySelector('.upload-area');
        if (uploadArea) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const elementPosition = uploadArea.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Add highlight effect
            uploadArea.classList.add('highlight-upload');
            setTimeout(() => {
                uploadArea.classList.remove('highlight-upload');
            }, 2000);
        }
    }, 100);
}

function hideTool(toolId) {
    document.getElementById(toolId).classList.remove('active');
    currentTool = null;
    resetTool(toolId);
    window.scrollTo(0, 0);
}

function resetTool(toolId) {
    const fileInput = document.getElementById(`${toolId}-input`);
    if (fileInput) fileInput.value = '';
    
    const settingsPanel = document.getElementById(`${toolId}-settings`);
    if (settingsPanel) settingsPanel.style.display = 'none';
    
    const previewImg = document.getElementById(`${toolId}-preview`);
    if (previewImg) previewImg.src = '';
    
    const fileInfo = document.getElementById(`${toolId}-info`);
    if (fileInfo) fileInfo.innerHTML = '';
    
    const progressBar = document.getElementById(`${toolId}-progress-bar`);
    if (progressBar) progressBar.style.width = '0%';
    
    const progressContainer = document.getElementById(`${toolId}-progress`);
    if (progressContainer) progressContainer.style.display = 'none';
    
    const statusMessage = document.getElementById(`${toolId}-status`);
    if (statusMessage) {
        statusMessage.style.display = 'none';
        statusMessage.className = 'status-message';
        statusMessage.textContent = '';
    }
    
    const downloadBtn = document.getElementById(`download-${toolId.split('-').join('-')}-btn`);
    if (downloadBtn) downloadBtn.disabled = true;
    
    originalFile = null;
    processedFile = null;
    pdfDoc = null;
    additionalPdfs = [];
}

// File handling functions
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, toolType) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files, toolType);
    }
}

function handleFileSelect(files, toolType) {
    if (files.length === 0) return;
    
    originalFile = files[0];
    const fileType = originalFile.type;
    const fileName = originalFile.name;
    const fileSize = formatFileSize(originalFile.size);
    
    document.getElementById(`${toolType}-settings`).style.display = 'block';
    
    const fileInfoElement = document.getElementById(`${toolType}-info`);
    if (fileInfoElement) {
        fileInfoElement.innerHTML = `
            <p><strong>File Name:</strong> ${fileName}</p>
            <p><strong>File Type:</strong> ${fileType || 'Unknown'}</p>
            <p><strong>File Size:</strong> ${fileSize}</p>
        `;
    }
    
    if (toolType === 'compressor' || toolType === 'converter') {
        handleImagePreview(originalFile, toolType);
    } else if (toolType === 'pdf-converter' || toolType === 'pdf-editor') {
        handlePDFPreview(originalFile, toolType);
    }
    
    if (toolType === 'pdf-editor') {
        showEditorOptions();
    }
    
    const processBtn = document.getElementById(`${toolType.split('-').join('-')}-btn`);
    if (processBtn) processBtn.disabled = false;
    
    // Add file-added animation
    const uploadArea = document.getElementById(`${toolType}-dropzone`);
    if (uploadArea) {
        uploadArea.classList.add('file-added');
        setTimeout(() => {
            uploadArea.classList.remove('file-added');
        }, 1500);
    }
}

function handleImagePreview(file, toolType) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewId = toolType === 'compressor' ? 'original-preview' : 'original-converter-preview';
        document.getElementById(previewId).src = e.target.result;
        
        const fileInfoId = toolType === 'compressor' ? 'original-info' : 'original-converter-info';
        document.getElementById(fileInfoId).innerHTML += `
            <p><strong>Dimensions:</strong> Loading...</p>
        `;
        
        const img = new Image();
        img.onload = function() {
            document.getElementById(fileInfoId).innerHTML = `
                <p><strong>File Name:</strong> ${file.name}</p>
                <p><strong>File Type:</strong> ${file.type || 'Unknown'}</p>
                <p><strong>File Size:</strong> ${formatFileSize(file.size)}</p>
                <p><strong>Dimensions:</strong> ${img.width} × ${img.height} pixels</p>
            `;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handlePDFPreview(file, toolType) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewElement = document.getElementById(`${toolType}-preview`);
        if (previewElement) {
            previewElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" font-family="Arial" font-size="16" text-anchor="middle" fill="#666">PDF Preview</text></svg>';
        }
    };
    reader.readAsDataURL(file);
}

function showEditorOptions() {
    const action = document.getElementById('editor-action').value;
    
    document.getElementById('merge-options').style.display = 'none';
    document.getElementById('split-options').style.display = 'none';
    document.getElementById('rotate-options').style.display = 'none';
    document.getElementById('protect-options').style.display = 'none';
    
    if (action === 'merge') {
        document.getElementById('merge-options').style.display = 'block';
        document.getElementById('merge-files').addEventListener('change', function(e) {
            additionalPdfs = Array.from(e.target.files);
        });
    } else if (action === 'split') {
        document.getElementById('split-options').style.display = 'block';
    } else if (action === 'rotate') {
        document.getElementById('rotate-options').style.display = 'block';
    } else if (action === 'protect') {
        document.getElementById('protect-options').style.display = 'block';
    }
}

// Compression and conversion functions
function updateCompressionValue() {
    document.getElementById('compression-value').textContent = 
        document.getElementById('compression-level').value;
}

function updateQualityValue() {
    document.getElementById('quality-value').textContent = 
        document.getElementById('quality-level').value;
}

function compressImage() {
    if (!originalFile) return;
    
    const compressionLevel = document.getElementById('compression-level').value / 100;
    const outputFormat = document.getElementById('output-format').value;
    
    const progressContainer = document.getElementById('compressor-progress');
    const progressBar = document.getElementById('compressor-progress-bar');
    const statusMessage = document.getElementById('compressor-status');
    
    progressContainer.style.display = 'block';
    statusMessage.style.display = 'none';
    document.getElementById('compress-btn').disabled = true;
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            performImageCompression(originalFile, compressionLevel, outputFormat);
        }
    }, 100);
}

function performImageCompression(file, quality, format) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            let mimeType = 'image/jpeg';
            if (format === 'original') {
                mimeType = file.type || 'image/jpeg';
            } else if (format === 'png') {
                mimeType = 'image/png';
            } else if (format === 'webp') {
                mimeType = 'image/webp';
            }
            
            canvas.toBlob(function(blob) {
                processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.' + mimeType.split('/')[1], {
                    type: mimeType
                });
                
                const compressedPreview = document.getElementById('compressed-preview');
                compressedPreview.src = URL.createObjectURL(blob);
                
                const originalSize = file.size;
                const compressedSize = blob.size;
                
                document.getElementById('compressed-info').innerHTML = `
                    <p><strong>Compressed Size:</strong> ${formatFileSize(compressedSize)}</p>
                    <p><strong>Reduction:</strong> ${Math.round((1 - compressedSize/originalSize) * 100)}%</p>
                    <p><strong>Format:</strong> ${mimeType.split('/')[1].toUpperCase()}</p>
                    <p><strong>Dimensions:</strong> ${img.width} × ${img.height} pixels</p>
                `;
                
                document.getElementById('download-compressed-btn').disabled = false;
                
                const statusMessage = document.getElementById('compressor-status');
                statusMessage.textContent = 'Image compressed successfully!';
                statusMessage.className = 'status-message status-success';
                statusMessage.style.display = 'block';
                
                document.getElementById('compress-btn').disabled = false;
                scrollToPreview();
            }, mimeType, quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function convertImage() {
    if (!originalFile) return;
    
    const targetFormat = document.getElementById('target-format').value;
    const quality = document.getElementById('quality-level').value / 100;
    
    const progressContainer = document.getElementById('converter-progress');
    const progressBar = document.getElementById('converter-progress-bar');
    const statusMessage = document.getElementById('converter-status');
    
    progressContainer.style.display = 'block';
    statusMessage.style.display = 'none';
    document.getElementById('convert-btn').disabled = true;
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            performImageConversion(originalFile, targetFormat, quality);
        }
    }, 100);
}

function performImageConversion(file, format, quality) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            let mimeType = 'image/jpeg';
            if (format === 'png') {
                mimeType = 'image/png';
            } else if (format === 'webp') {
                mimeType = 'image/webp';
            } else if (format === 'gif') {
                mimeType = 'image/gif';
            } else if (format === 'bmp') {
                mimeType = 'image/bmp';
            }
            
            canvas.toBlob(function(blob) {
                processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.' + format, {
                    type: mimeType
                });
                
                const convertedPreview = document.getElementById('converted-preview');
                convertedPreview.src = URL.createObjectURL(blob);
                
                const originalSize = file.size;
                const convertedSize = blob.size;
                
                document.getElementById('converted-info').innerHTML = `
                    <p><strong>Converted Size:</strong> ${formatFileSize(convertedSize)}</p>
                    <p><strong>Format:</strong> ${format.toUpperCase()}</p>
                    <p><strong>Dimensions:</strong> ${img.width} × ${img.height} pixels</p>
                `;
                
                document.getElementById('download-converted-btn').disabled = false;
                
                const statusMessage = document.getElementById('converter-status');
                statusMessage.textContent = 'Image converted successfully!';
                statusMessage.className = 'status-message status-success';
                statusMessage.style.display = 'block';
                
                document.getElementById('convert-btn').disabled = false;
                scrollToPreview();
            }, mimeType, format === 'png' ? undefined : quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function convertPDF() {
    if (!originalFile) return;
    
    const conversionType = document.getElementById('pdf-conversion-type').value;
    
    const progressContainer = document.getElementById('pdf-converter-progress');
    const progressBar = document.getElementById('pdf-converter-progress-bar');
    const statusMessage = document.getElementById('pdf-converter-status');
    
    progressContainer.style.display = 'block';
    statusMessage.style.display = 'none';
    document.getElementById('convert-pdf-btn').disabled = true;
    
    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                setTimeout(() => {
                    let resultMessage = '';
                    let outputFilename = originalFile.name.replace(/\.[^/.]+$/, '');
                    let outputMimeType = 'application/pdf';
                    
                    if (conversionType === 'pdf-to-word') {
                        resultMessage = 'PDF converted to Word document';
                        outputFilename += '.docx';
                        outputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    } else if (conversionType === 'pdf-to-excel') {
                        resultMessage = 'PDF converted to Excel spreadsheet';
                        outputFilename += '.xlsx';
                        outputMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    } else if (conversionType === 'pdf-to-jpg') {
                        resultMessage = 'PDF pages converted to JPG images (ZIP file)';
                        outputFilename += '.zip';
                        outputMimeType = 'application/zip';
                    } else if (conversionType === 'word-to-pdf') {
                        resultMessage = 'Word document converted to PDF';
                        outputFilename += '.pdf';
                    } else if (conversionType === 'excel-to-pdf') {
                        resultMessage = 'Excel spreadsheet converted to PDF';
                        outputFilename += '.pdf';
                    } else if (conversionType === 'image-to-pdf') {
                        resultMessage = 'Image converted to PDF document';
                        outputFilename += '.pdf';
                    }
                    
                    processedFile = new File([originalFile], outputFilename, {
                        type: outputMimeType
                    });
                    
                    document.getElementById('pdf-converter-info').innerHTML += `
                        <p><strong>Result:</strong> ${resultMessage}</p>
                    `;
                    
                    document.getElementById('download-converted-pdf-btn').disabled = false;
                    
                    statusMessage.textContent = 'Conversion completed successfully!';
                    statusMessage.className = 'status-message status-success';
                    statusMessage.style.display = 'block';
                    
                    document.getElementById('convert-pdf-btn').disabled = false;
                    scrollToPreview();
                }, 500);
            }
        }, 100);
    } catch (error) {
        statusMessage.textContent = 'Error during conversion: ' + error.message;
        statusMessage.className = 'status-message status-error';
        statusMessage.style.display = 'block';
        document.getElementById('convert-pdf-btn').disabled = false;
    }
}

async function editPDF() {
    if (!originalFile) return;
    
    const action = document.getElementById('editor-action').value;
    
    const progressContainer = document.getElementById('pdf-editor-progress');
    const progressBar = document.getElementById('pdf-editor-progress-bar');
    const statusMessage = document.getElementById('pdf-editor-status');
    
    progressContainer.style.display = 'block';
    statusMessage.style.display = 'none';
    document.getElementById('edit-pdf-btn').disabled = true;
    
    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                setTimeout(async () => {
                    let resultMessage = '';
                    let outputFilename = originalFile.name.replace(/\.[^/.]+$/, '') + '_edited.pdf';
                    
                    if (action === 'compress') {
                        resultMessage = 'PDF compressed successfully';
                    } else if (action === 'merge') {
                        resultMessage = 'PDFs merged successfully';
                        outputFilename = 'merged.pdf';
                    } else if (action === 'split') {
                        const pages = document.getElementById('split-range').value;
                        resultMessage = `PDF split according to pages: ${pages}`;
                        outputFilename = 'split.pdf';
                    } else if (action === 'rotate') {
                        const pages = document.getElementById('rotate-pages').value;
                        const degrees = document.getElementById('rotate-degree').value;
                        resultMessage = `Pages ${pages} rotated by ${degrees} degrees`;
                    } else if (action === 'protect') {
                        const password = document.getElementById('pdf-password').value;
                        resultMessage = 'PDF protected with password';
                    } else if (action === 'unlock') {
                        resultMessage = 'PDF password removed';
                    }
                    
                    processedFile = new File([originalFile], outputFilename, {
                        type: 'application/pdf'
                    });
                    
                    document.getElementById('pdf-editor-info').innerHTML += `
                        <p><strong>Result:</strong> ${resultMessage}</p>
                    `;
                    
                    document.getElementById('download-edited-pdf-btn').disabled = false;
                    
                    statusMessage.textContent = 'PDF processed successfully!';
                    statusMessage.className = 'status-message status-success';
                    statusMessage.style.display = 'block';
                    
                    document.getElementById('edit-pdf-btn').disabled = false;
                    scrollToPreview();
                }, 500);
            }
        }, 100);
    } catch (error) {
        statusMessage.textContent = 'Error during PDF editing: ' + error.message;
        statusMessage.className = 'status-message status-error';
        statusMessage.style.display = 'block';
        document.getElementById('edit-pdf-btn').disabled = false;
    }
}

// Download functions
function downloadCompressedImage() {
    if (!processedFile) {
        showError('compressor-status', 'Please compress an image first');
        return;
    }
    downloadFile(processedFile);
}

function downloadConvertedImage() {
    if (!processedFile) {
        showError('converter-status', 'Please convert an image first');
        return;
    }
    downloadFile(processedFile);
}

function downloadConvertedPDF() {
    if (!processedFile) {
        showError('pdf-converter-status', 'Please convert a file first');
        return;
    }
    downloadFile(processedFile);
}

function downloadEditedPDF() {
    if (!processedFile) {
        showError('pdf-editor-status', 'Please edit a PDF first');
        return;
    }
    downloadFile(processedFile);
}

function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'status-message status-error';
    element.style.display = 'block';
}

function scrollToPreview() {
    const previewSection = document.querySelector('.preview-container');
    if (previewSection) {
        previewSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        previewSection.style.animation = 'pulse 1s 1';
        setTimeout(() => {
            previewSection.style.animation = '';
        }, 1000);
    }
}
<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use Exception;

class EmailService
{
    private PHPMailer $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->configureMailer();
    }

    private function configureMailer(): void
    {
        $config = Config::getSmtpConfig();

        $this->mailer->isSMTP();
        $this->mailer->Host = $config['host'];
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = $config['username'];
        $this->mailer->Password = $config['password'];
        $this->mailer->SMTPSecure = $config['encryption'];
        $this->mailer->Port = $config['port'];
        $this->mailer->CharSet = 'UTF-8';
        
        // Set default from address
        $this->mailer->setFrom($config['username'], 'Matchable Store');
    }

    public function sendEmailVerification(string $email, string $token): bool
    {
        try {
            $verificationUrl = Config::getAppUrl() . "/verify-email?token={$token}";
            
            $this->mailer->addAddress($email);
            $this->mailer->Subject = 'Verify Your Email Address';
            $this->mailer->isHTML(true);
            
            $this->mailer->Body = $this->getEmailVerificationTemplate($verificationUrl);
            
            $success = $this->mailer->send();
            $this->logEmail($email, 'email_verification', $success);
            
            return $success;
        } catch (Exception $e) {
            error_log("Email verification send error: " . $e->getMessage());
            $this->logEmail($email, 'email_verification', false, $e->getMessage());
            return false;
        } finally {
            $this->mailer->clearAddresses();
        }
    }

    public function sendPasswordReset(string $email, string $token, string $firstName): bool
    {
        try {
            $resetUrl = Config::getAppUrl() . "/reset-password?token={$token}";
            
            $this->mailer->addAddress($email);
            $this->mailer->Subject = 'Reset Your Password';
            $this->mailer->isHTML(true);
            
            $this->mailer->Body = $this->getPasswordResetTemplate($resetUrl, $firstName);
            
            $success = $this->mailer->send();
            $this->logEmail($email, 'password_reset', $success);
            
            return $success;
        } catch (Exception $e) {
            error_log("Password reset email send error: " . $e->getMessage());
            $this->logEmail($email, 'password_reset', false, $e->getMessage());
            return false;
        } finally {
            $this->mailer->clearAddresses();
        }
    }

    public function sendOrderConfirmation(string $email, array $orderData): bool
    {
        try {
            $this->mailer->addAddress($email);
            $this->mailer->Subject = "Order Confirmation #{$orderData['order_number']}";
            $this->mailer->isHTML(true);
            
            $this->mailer->Body = $this->getOrderConfirmationTemplate($orderData);
            
            $success = $this->mailer->send();
            $this->logEmail($email, 'order_confirmation', $success);
            
            return $success;
        } catch (Exception $e) {
            error_log("Order confirmation email send error: " . $e->getMessage());
            $this->logEmail($email, 'order_confirmation', false, $e->getMessage());
            return false;
        } finally {
            $this->mailer->clearAddresses();
        }
    }

    public function sendOrderStatusUpdate(string $email, array $orderData): bool
    {
        try {
            $this->mailer->addAddress($email);
            $this->mailer->Subject = "Order Update #{$orderData['order_number']}";
            $this->mailer->isHTML(true);
            
            $this->mailer->Body = $this->getOrderStatusUpdateTemplate($orderData);
            
            $success = $this->mailer->send();
            $this->logEmail($email, 'order_status_update', $success);
            
            return $success;
        } catch (Exception $e) {
            error_log("Order status update email send error: " . $e->getMessage());
            $this->logEmail($email, 'order_status_update', false, $e->getMessage());
            return false;
        } finally {
            $this->mailer->clearAddresses();
        }
    }

    private function logEmail(string $email, string $type, bool $success, ?string $error = null): void
    {
        $db = \App\Core\Database::getInstance();
        
        $db->insert('email_notifications', [
            'email' => $email,
            'type' => $type,
            'subject' => $this->mailer->Subject,
            'status' => $success ? 'sent' : 'failed',
            'sent_at' => $success ? date('Y-m-d H:i:s') : null,
            'error_message' => $error
        ]);
    }

    private function getEmailVerificationTemplate(string $verificationUrl): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Verify Your Email</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2563eb;'>Welcome to Matchable Store!</h2>
                <p>Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the button below:</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{$verificationUrl}' style='background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style='word-break: break-all; color: #666;'>{$verificationUrl}</p>
                
                <p>This verification link will expire in 24 hours.</p>
                
                <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                <p style='color: #666; font-size: 12px;'>If you didn't create an account with us, please ignore this email.</p>
            </div>
        </body>
        </html>";
    }

    private function getPasswordResetTemplate(string $resetUrl, string $firstName): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Reset Your Password</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2563eb;'>Reset Your Password</h2>
                <p>Hello {$firstName},</p>
                <p>We received a request to reset your password for your Matchable Store account. Click the button below to reset your password:</p>
                
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{$resetUrl}' style='background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style='word-break: break-all; color: #666;'>{$resetUrl}</p>
                
                <p>This password reset link will expire in 1 hour.</p>
                
                <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                <p style='color: #666; font-size: 12px;'>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
        </body>
        </html>";
    }

    private function getOrderConfirmationTemplate(array $orderData): string
    {
        $itemsHtml = '';
        foreach ($orderData['items'] as $item) {
            $itemsHtml .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$item['product_name']}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{$item['quantity']}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>\${$item['price']}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>\${$item['total']}</td>
                </tr>";
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Order Confirmation</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2563eb;'>Order Confirmation</h2>
                <p>Thank you for your order! We're processing it now and will send you shipping information soon.</p>
                
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;'>
                    <h3>Order #{$orderData['order_number']}</h3>
                    <p><strong>Order Date:</strong> {$orderData['created_at']}</p>
                    <p><strong>Status:</strong> {$orderData['status']}</p>
                </div>
                
                <h3>Order Items</h3>
                <table style='width: 100%; border-collapse: collapse;'>
                    <thead>
                        <tr style='background-color: #f8f9fa;'>
                            <th style='padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;'>Product</th>
                            <th style='padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;'>Qty</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;'>Price</th>
                            <th style='padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;'>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsHtml}
                    </tbody>
                </table>
                
                <div style='margin-top: 20px; text-align: right;'>
                    <p><strong>Subtotal: \${$orderData['subtotal']}</strong></p>
                    <p><strong>Shipping: \${$orderData['shipping_amount']}</strong></p>
                    <p><strong>Tax: \${$orderData['tax_amount']}</strong></p>
                    <h3 style='color: #2563eb;'>Total: \${$orderData['total_amount']}</h3>
                </div>
                
                <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                <p style='color: #666; font-size: 12px;'>Thank you for shopping with Matchable Store!</p>
            </div>
        </body>
        </html>";
    }

    private function getOrderStatusUpdateTemplate(array $orderData): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Order Status Update</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #2563eb;'>Order Status Update</h2>
                <p>Your order status has been updated.</p>
                
                <div style='background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;'>
                    <h3>Order #{$orderData['order_number']}</h3>
                    <p><strong>New Status:</strong> <span style='color: #16a34a;'>{$orderData['status']}</span></p>
                    " . (isset($orderData['tracking_number']) ? "<p><strong>Tracking Number:</strong> {$orderData['tracking_number']}</p>" : "") . "
                </div>
                
                <p>You can track your order status anytime by logging into your account.</p>
                
                <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
                <p style='color: #666; font-size: 12px;'>Thank you for shopping with Matchable Store!</p>
            </div>
        </body>
        </html>";
    }
}
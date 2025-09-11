import React from 'react';
import ErrorAlert from './ErrorAlert';

interface LoginErrorHandlerProps {
  error: any;
  onClose: () => void;
}

const LoginErrorHandler: React.FC<LoginErrorHandlerProps> = ({ error, onClose }) => {
  const getErrorDetails = (error: any) => {
    // Network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        type: 'error' as const,
        title: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        message: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        details: 'Network Error: ' + error.message
      };
    }

    // HTTP Status errors
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return {
            type: 'warning' as const,
            title: 'ข้อมูลไม่ถูกต้อง',
            message: 'กรุณาตรวจสอบรูปแบบอีเมลและรหัสผ่าน',
            details: `Status: ${error.response.status} - ${error.message}`
          };
        case 401:
          return {
            type: 'error' as const,
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง',
            details: `Status: ${error.response.status} - ${error.message}`
          };
        case 403:
          return {
            type: 'error' as const,
            title: 'ไม่มีสิทธิ์เข้าถึง',
            message: 'บัญชีของคุณไม่มีสิทธิ์เข้าถึงระบบนี้',
            details: `Status: ${error.response.status} - ${error.message}`
          };
        case 404:
          return {
            type: 'error' as const,
            title: 'ไม่พบเซิร์ฟเวอร์',
            message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาติดต่อผู้ดูแลระบบ',
            details: `Status: ${error.response.status} - ${error.message}`
          };
        case 500:
          return {
            type: 'error' as const,
            title: 'ข้อผิดพลาดของเซิร์ฟเวอร์',
            message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งในภายหลัง',
            details: `Status: ${error.response.status} - ${error.message}`
          };
        default:
          return {
            type: 'error' as const,
            title: 'เกิดข้อผิดพลาด',
            message: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
            details: `Status: ${error.response.status} - ${error.message}`
          };
      }
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('required')) {
      return {
        type: 'warning' as const,
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        details: error.message
      };
    }

    // Generic error
    return {
      type: 'error' as const,
      title: 'เกิดข้อผิดพลาด',
      message: error.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง',
      details: JSON.stringify(error, null, 2)
    };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="mb-4">
      <ErrorAlert
        type={errorDetails.type}
        title={errorDetails.title}
        message={errorDetails.message}
        details={errorDetails.details}
        onClose={onClose}
        showCloseButton={true}
      />
    </div>
  );
};

export default LoginErrorHandler;

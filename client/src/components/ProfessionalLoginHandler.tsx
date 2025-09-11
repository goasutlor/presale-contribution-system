import React from 'react';
import ProfessionalNotification from './ProfessionalNotification';

interface LoginErrorHandlerProps {
  error: any;
  onClose: () => void;
  onRetry?: () => void;
}

const ProfessionalLoginHandler: React.FC<LoginErrorHandlerProps> = ({ 
  error, 
  onClose, 
  onRetry 
}) => {
  console.log('🔍 ProfessionalLoginHandler rendered with error:', error);
  
  const getErrorDetails = (error: any) => {
    console.log('🔍 Analyzing error:', error);

    // Network/Connection errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('ERR_NETWORK') ||
        error.code === 'NETWORK_ERROR') {
      return {
        type: 'network' as const,
        title: '🌐 ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
        message: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและให้แน่ใจว่าเซิร์ฟเวอร์ทำงานอยู่',
        details: `Network Error: ${error.message}\nCode: ${error.code || 'Unknown'}\n\nการแก้ไข:\n1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n2. ตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่\n3. ลองรีเฟรชหน้าเว็บ`,
        action: onRetry ? {
          label: '🔄 ลองใหม่',
          onClick: onRetry
        } : undefined
      };
    }

    // HTTP Status errors
    if (error.response?.status) {
      const status = error.response.status;
      const statusText = error.response.statusText || 'Unknown Error';
      
      switch (status) {
        case 400:
          return {
            type: 'warning' as const,
            title: 'ข้อมูลไม่ถูกต้อง',
            message: 'กรุณาตรวจสอบรูปแบบอีเมลและรหัสผ่านให้ถูกต้อง',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nResponse: ${JSON.stringify(error.response.data, null, 2)}`,
            action: onRetry ? {
              label: 'ลองใหม่',
              onClick: onRetry
            } : undefined
          };
          
        case 401:
          return {
            type: 'auth' as const,
            title: '🔐 เข้าสู่ระบบไม่สำเร็จ',
            message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\n\nสาเหตุที่เป็นไปได้:\n❌ อีเมลไม่ถูกต้อง\n❌ รหัสผ่านผิด\n❌ บัญชีถูกระงับ\n❌ Token หมดอายุ\n\nข้อมูลทดสอบ:\n• admin@presale.com / password\n• user@company.com / password\n• sontas.j@g-able.com / password`,
            action: onRetry ? {
              label: '🔄 ลองใหม่',
              onClick: onRetry
            } : undefined
          };
          
        case 403:
          return {
            type: 'auth' as const,
            title: 'ไม่มีสิทธิ์เข้าถึง',
            message: 'บัญชีของคุณไม่มีสิทธิ์เข้าถึงระบบนี้ กรุณาติดต่อผู้ดูแลระบบ',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nAccount may be:\n- Suspended\n- Not activated\n- Missing required permissions`,
            action: onRetry ? {
              label: 'ลองใหม่',
              onClick: onRetry
            } : undefined
          };
          
        case 404:
          return {
            type: 'server' as const,
            title: 'ไม่พบเซิร์ฟเวอร์',
            message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาติดต่อผู้ดูแลระบบ',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nServer may be:\n- Down for maintenance\n- Moved to different URL\n- Not responding`,
            action: onRetry ? {
              label: 'ลองใหม่',
              onClick: onRetry
            } : undefined
          };
          
        case 422:
          return {
            type: 'warning' as const,
            title: 'ข้อมูลไม่ถูกต้อง',
            message: 'กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้อง',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nValidation errors: ${JSON.stringify(error.response.data, null, 2)}`,
            action: onRetry ? {
              label: 'แก้ไขข้อมูล',
              onClick: onRetry
            } : undefined
          };
          
        case 429:
          return {
            type: 'warning' as const,
            title: 'ลองเข้าสู่ระบบบ่อยเกินไป',
            message: 'กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nRate limit exceeded`,
            action: onRetry ? {
              label: 'ลองใหม่ในภายหลัง',
              onClick: onRetry
            } : undefined
          };
          
        case 500:
          return {
            type: 'server' as const,
            title: 'ข้อผิดพลาดของเซิร์ฟเวอร์',
            message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งในภายหลัง',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nServer error details: ${JSON.stringify(error.response.data, null, 2)}`,
            action: onRetry ? {
              label: 'ลองใหม่',
              onClick: onRetry
            } : undefined
          };
          
        case 502:
        case 503:
        case 504:
          return {
            type: 'server' as const,
            title: 'เซิร์ฟเวอร์ไม่พร้อมใช้งาน',
            message: 'เซิร์ฟเวอร์กำลังอยู่ระหว่างการบำรุงรักษา กรุณาลองใหม่อีกครั้งในภายหลัง',
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nServer is temporarily unavailable`,
            action: onRetry ? {
              label: 'ลองใหม่',
              onClick: onRetry
            } : undefined
          };
          
        default:
          return {
            type: 'error' as const,
            title: 'เกิดข้อผิดพลาด',
            message: `เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ (HTTP ${status})`,
            details: `HTTP ${status}: ${statusText}\nMessage: ${error.message}\nFull error: ${JSON.stringify(error, null, 2)}`,
            action: onRetry ? {
              label: 'ลองใหม่',
              onClick: onRetry
            } : undefined
          };
      }
    }

    // Validation errors
    if (error.message?.includes('validation') || 
        error.message?.includes('required') ||
        error.message?.includes('กรุณากรอก')) {
      return {
        type: 'warning' as const,
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง',
        details: `Validation Error: ${error.message}\nPlease check:\n- Email format\n- Password length\n- Required fields`,
        action: onRetry ? {
          label: 'แก้ไขข้อมูล',
          onClick: onRetry
        } : undefined
      };
    }

    // Timeout errors
    if (error.message?.includes('timeout') || 
        error.message?.includes('TIMEOUT') ||
        error.code === 'ECONNABORTED') {
      return {
        type: 'network' as const,
        title: 'การเชื่อมต่อหมดเวลา',
        message: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่',
        details: `Timeout Error: ${error.message}\nCode: ${error.code || 'Unknown'}\nThis usually means:\n- Slow internet connection\n- Server overloaded\n- Network issues`,
        action: onRetry ? {
          label: '🔄 ลองใหม่',
          onClick: onRetry
        } : undefined
      };
    }

    // Generic error
    return {
      type: 'error' as const,
      title: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      message: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง',
      details: `Error Type: ${error.constructor.name}\nMessage: ${error.message}\nStack: ${error.stack}\nFull Error: ${JSON.stringify(error, null, 2)}`,
      action: onRetry ? {
        label: 'ลองใหม่',
        onClick: onRetry
      } : undefined
    };
  };

  const errorDetails = getErrorDetails(error);
  console.log('🔴 ProfessionalLoginHandler returning error details:', errorDetails);

  console.log('🔴 Rendering ProfessionalNotification with:', { type: errorDetails.type, title: errorDetails.title });
  
  return (
    <ProfessionalNotification
      type={errorDetails.type}
      title={errorDetails.title}
      message={errorDetails.message}
      details={errorDetails.details}
      action={errorDetails.action}
      onClose={onClose}
      autoClose={false} // Don't auto-close errors
    />
  );
};

export default ProfessionalLoginHandler;

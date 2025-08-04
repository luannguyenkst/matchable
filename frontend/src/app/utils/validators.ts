import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export class CustomValidators {
  static email(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) ? null : { email: true };
  }

  static password(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const errors: ValidationErrors = {};
    
    if (password.length < 8) {
      errors['minLength'] = true;
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors['requiresLowercase'] = true;
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors['requiresUppercase'] = true;
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors['requiresNumber'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  static confirmPassword(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control.value;
      
      if (!password || !confirmPassword) return null;
      
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  static phone(control: AbstractControl): ValidationErrors | null {
    const phone = control.value;
    if (!phone) return null;
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')) ? null : { phone: true };
  }

  static postalCode(control: AbstractControl): ValidationErrors | null {
    const postalCode = control.value;
    if (!postalCode) return null;
    
    // US ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(postalCode) ? null : { postalCode: true };
  }

  static minValue(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      if (isNaN(value)) return null;
      
      return value >= min ? null : { minValue: { min, actual: value } };
    };
  }

  static maxValue(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      if (isNaN(value)) return null;
      
      return value <= max ? null : { maxValue: { max, actual: value } };
    };
  }

  static creditCard(control: AbstractControl): ValidationErrors | null {
    const cardNumber = control.value;
    if (!cardNumber) return null;
    
    // Remove spaces and hyphens
    const cleaned = cardNumber.replace(/[\s\-]/g, '');
    
    // Check if all digits
    if (!/^\d+$/.test(cleaned)) return { creditCard: true };
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0 ? null : { creditCard: true };
  }

  static cvv(control: AbstractControl): ValidationErrors | null {
    const cvv = control.value;
    if (!cvv) return null;
    
    const cvvRegex = /^\d{3,4}$/;
    return cvvRegex.test(cvv) ? null : { cvv: true };
  }

  static expiryDate(control: AbstractControl): ValidationErrors | null {
    const expiry = control.value;
    if (!expiry) return null;
    
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) return { expiryDate: true };
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return { expiredCard: true };
    }
    
    return null;
  }
}
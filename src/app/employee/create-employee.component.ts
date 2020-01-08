import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, FormArray } from '@angular/forms';
import { CustomValidators } from '../shared/custom.validators';
import { IEmployee } from './IEmployee';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from './employee.service';
import { ISkill } from './ISkill';
@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent implements OnInit {
  employeeForm: FormGroup;
  employee: IEmployee;
  pageTitle: string;

  constructor(private fb: FormBuilder,
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private router: Router) { }
  formErrors = {
    'fullName': '',
    'email': '',
    'confirmEmail': '',
    'emailGroup': '',
    'phone': '',
    'skillName': '',
    'experienceInYears': '',
    'proficiency': ''

  };

  validationMessages = {
    'fullName': {
      'required': 'Full Name is required.',
      'minlength': 'Full Name must be greater than 2 characters.',
      'maxlength': 'Full Name must be less than 10 characters.'
    },
    'email': {
      'required': 'Email is required.',
      'emailDomain': 'Email domian should be dell.com'
    },
    'confirmEmail': {
      'required': 'Confirm Email is required.'
    },
    'emailGroup': {
      'emailMismatch': 'Email and Confirm Email do not match.'
    },
    'phone': {
      'required': 'Phone is required.'
    },
    /* 'skillName': {
      'required': 'Skill Name is required.',
    },
    'experienceInYears': {
      'required': 'Experience is required.',
    },
    'proficiency': {
      'required': 'Proficiency is required.',
    }, */
  }
  ngOnInit() {
    /* this.employeeForm=new FormGroup({
      fullName:new FormControl(),
      email:new FormControl(),
      skills:new FormGroup({
        skillName:new FormControl(),
        experienceInYears:new FormControl(),
        proficiency:new FormControl()
      })
    }); */
    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2),
      Validators.maxLength(10)]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required,
        CustomValidators.emailDomain('dell.com')]],
        confirmEmail: ['', [Validators.required]],
      }, { validator: matchEmails }),
      phone: [''],
      contactPreference: ['email'],
      skills: this.fb.array([
        this.addSkillFormGroup()
      ])
    });

    /*  this.employeeForm.get('fullName').valueChanges.subscribe(
       value => {
         console.log(value);
       }
     ) */
    /*  this.employeeForm.valueChanges.subscribe(
       value => {
         console.log(JSON.stringify(value));
       }
     ); */
    this.employeeForm.valueChanges.subscribe((data) => {
      this.logValidationErrors(this.employeeForm);
    })

    this.employeeForm.get('contactPreference')
      .valueChanges.subscribe((data: string) => {
        this.onContactPreferenceChange(data);
      });

    this.route.paramMap.subscribe(params => {
      const empId = +params.get('id');
      if (empId) {
        this.pageTitle = 'Edit Employee';
        this.getEmployee(empId);
      } else {
        this.pageTitle = 'Create Employee';
        this.employee = {
          id: null,
          fullName: '',
          contactPreference: '',
          email: '',
          phone: null,
          skills: []
        }
      }
    });
  }

  mapFormValuesToEmployeeModel() {
    this.employee.fullName = this.employeeForm.value.fullName;
    this.employee.contactPreference = this.employeeForm.value.contactPreference;
    this.employee.email = this.employeeForm.value.emailGroup.email;
    this.employee.phone = this.employeeForm.value.phone;
    this.employee.skills = this.employeeForm.value.skills;
  }
  getEmployee(id: number) {
    this.employeeService.getEmployee(id)
      .subscribe(
        (employee: IEmployee) => {
          this.employee = employee;
          this.editEmployee(employee);
        },
        (err: any) => console.log(err)
      );
  }
  editEmployee(employee: IEmployee) {
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      contactPreference: employee.contactPreference,
      emailGroup: {
        email: employee.email,
        confirmEmail: employee.email
      },
      phone: employee.phone
    });
    this.employeeForm.setControl("skills", this.setExistingSkills(employee.skills));
  }
  addSkillButtonClick(): void {
    (<FormArray>this.employeeForm.get('skills')).push(this.addSkillFormGroup());
  }
  addSkillFormGroup(): FormGroup {
    return this.fb.group({
      skillName: ['', Validators.required],
      experienceInYears: ['', Validators.required],
      proficiency: ['', Validators.required]
    });
  }
  removeSkillButtonClick(skillGroupIndex: number): void {
    const skillsFormAray = (<FormArray>this.employeeForm.get('skills'));
    skillsFormAray.removeAt(skillGroupIndex);
    skillsFormAray.markAsDirty();
    skillsFormAray.markAsTouched();
  }
  setExistingSkills(skillSets: ISkill[]): FormArray {
    const formArray = new FormArray([]);
    skillSets.forEach(s => {
      formArray.push(this.fb.group({
        skillName: s.skillName,
        experienceInYears: s.experienceInYears,
        proficiency: s.proficiency
      }));
    });
    return formArray;
  }
  onContactPreferenceChange(selectedValue: string) {
    const phoneFormControl = this.employeeForm.get('phone');
    if (selectedValue === 'phone') {
      phoneFormControl.setValidators(Validators.required);
    }
    else {
      phoneFormControl.clearValidators();
    }
    phoneFormControl.updateValueAndValidity();
  }
  logValidationErrors(group: FormGroup = this.employeeForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);
      this.formErrors[key] = '';
      // Loop through nested form groups and form controls to check
      // for validation errors. For the form groups and form controls
      // that have failed validation, retrieve the corresponding
      // validation message from validationMessages object and store
      // it in the formErrors object. The UI binds to the formErrors
      // object properties to display the validation errors.
      if (abstractControl && !abstractControl.valid
        && (abstractControl.touched || abstractControl.dirty
          || abstractControl.value !== '')) {
        const messages = this.validationMessages[key];
        for (const errorKey in abstractControl.errors) {
          if (errorKey) {
            this.formErrors[key] += messages[errorKey] + ' ';
          }
        }
      }

      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl);
      }
      /*     if(abstractControl instanceof FormArray)
          {
            for(const control of abstractControl.controls)
            {
              if (control instanceof FormGroup) {
                this.logValidationErrors(control);
              }
            }
          } */
    });
  }
  onLoadDataClick(): void {
    /* this.employeeForm.patchValue({
      fullName:'Rithvik Tech',
     email:'ranga@gmail.com'
    }); */
    /* this.employeeForm.setValue({
     fullName:'Rithvik Tech',
     email:'ranga@gmail.com',
     skills:{
       skillName:'C#',
       experienceInYears:5,
       proficiency:'beginner'
     }
    }); */
    //this.logValidationErrors(this.employeeForm);
    //console.log(this.formErrors);
  }
  onSubmit(): void {
    //console.log(this.employeeForm.value);
    this.mapFormValuesToEmployeeModel();
    if(this.employee.id)
    {
    this.employeeService.updateEmployee(this.employee)
      .subscribe(
        () => this.router.navigate(['employees']),
        (err: any) => console.log(err)
      );
    }
    else
    {
       this.employeeService.addEmployee(this.employee)
       .subscribe(
         () => this.router.navigate(['employees']),
         (err:any) => console.log(err)
       );
    }
  }


}
function matchEmails(group: AbstractControl): { [key: string]: any } | null {
  const emailControl = group.get('email');
  const confirmEmailControl = group.get('confirmEmail');
  if (emailControl.value === confirmEmailControl.value ||
    (confirmEmailControl.pristine && confirmEmailControl.value === '')) {
    return null;
  } else {
    return { 'emailMismatch': true };
  }
}
/* function emailDomain(domainName:string) {

return (control:AbstractControl):{[key:string]:any}  | null =>
{
   const email:string = control.value;
   const domain = email.substring(email.lastIndexOf('@') + 1);
   if(email === '' || domain.toLowerCase() === domainName.toLowerCase())
   {
     return null;
   }
   else{
     return {'emailDomain':true};
   }
  }
} */
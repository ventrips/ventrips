export class MockData {
  public static postsJSON = [
    {
        slug: 'voluptatem-et-quo',
        uid: 'a2bde023-4191-423e-bdec-cc8c875c05c2',
        topic: 'Data',
        title: 'Chief Intranet Manager 21093i210913i209312i09',
        description: 'Laboriosam vitae aut.',
        image: 'http://lorempixel.com/640/480/sports',
        // tslint:disable-next-line:max-line-length
        body: `<h2><strong style=\'color: rgb(153, 51, 0);\'>Angular 7 Observables Tutorial With Example</strong></h2><p class=\'ql-align-center\'><br></p><p class=\'ql-align-justify\'>We start Angular Observables by learning an example. So let us install Angular 7 Project using Angular CLI.</p><h2><strong style=\'color: rgb(153, 51, 0);\'>Step 1: Create an Angular 7 Project</strong></h2><p>Type the following command to create Angular Project using Angular CLI.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>ng new observe\n</pre><p>&nbsp;</p><p><a href=\'https://appdividend.com/wp-content/uploads/2018/12/Angular-7-Observables-Tutorial-With-Example.png\' target=\'_blank\' style=\'color: rgb(0, 128, 206);\'><img src=\'https://appdividend.com/wp-content/uploads/2018/12/Angular-7-Observables-Tutorial-With-Example.png\' alt=\'Angular 7 Observables Tutorial With Example\' height=\'485\' width=\'597\'></a></p><p class=\'ql-align-justify\'>Now, go inside the project and open the project in VSCode or any other editor.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>cd observe &amp;&amp; code .\n</pre><p>Also, install the Bootstrap CSS Framework.</p><p class=\'ql-align-center\'><br></p><pre class=\'ql-syntax\' spellcheck=\'false\'>npm install bootstrap --save\n</pre><h2><strong style=\'color: rgb(153, 51, 0);\'>Step 2: Create a service and model files</strong></h2><p>Create an Angular service using the following command.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>ng g s student --spec=false\n</pre><p>It will create a file&nbsp;<strong>student.service.ts&nbsp;</strong>file inside the&nbsp;<strong>src &gt;&gt; app&nbsp;</strong>folder.</p><p class=\'ql-align-justify\'>We have created service because we will use service to handle the data that needs to be displayed on the frontend.</p><p class=\'ql-align-center\'><br></p><p class=\'ql-align-justify\'>Also, create a new file inside the&nbsp;<strong>src &gt;&gt; app&nbsp;</strong>folder called&nbsp;<strong>student.model.ts</strong>&nbsp;and add the following code inside it.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>// student.model.ts\n\nexport class Student {\n    id: Number;\n    name: String;\n    EnrollmentNumber: Number;\n    College: String;\n    University: String;\n}\n</pre><p class=\'ql-align-justify\'>That means we have defined the Student type in our application which has the&nbsp;<strong>id, name, enrollment number, college,&nbsp;</strong>and<strong>&nbsp;university&nbsp;</strong>properties<strong>.</strong></p><p class=\'ql-align-justify\'>Now, we need to add the demo data inside the&nbsp;<strong>student.service.ts&nbsp;</strong>file. The data is the type of Student model which we have defined above.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>// student.service.ts\n\nimport { Injectable } from '@angular/core';\nimport { Student } from './student.model';\n\n@Injectable({\n  providedIn: 'root'\n})\nexport class StudentService {\n\nstudents: Student[] = [{\n    id: 1,\n    name: 'Krunal',\n    enrollmentnumber: 110470116021,\n    college: 'VVP Engineering College',\n    university: 'GTU'\n},\n{\n    id: 2,\n    name: 'Rushabh',\n    enrollmentnumber: 110470116023,\n    college: 'VVP Engineering College',\n    university: 'GTU'\n},\n{\n    id: 3,\n    name: 'Ankit',\n    enrollmentnumber: 110470116022,\n    college: 'VVP Engineering College',\n    university: 'GTU'\n}];\n\n  constructor() { }\n}\n</pre><h2><strong style=\'color: rgb(153, 51, 0);\'>Step 3: Create an Observable</strong></h2><p class=\'ql-align-justify\'>Now, we have defined the private data. We need to create one function inside the service that will return that data in the form of observable. So we can subscribe to it, and we get the data and display it on the frontend. Add the following code inside the&nbsp;<strong>student.service.ts.&nbsp;</strong>Put the&nbsp;<strong>getStudents()&nbsp;</strong>function inside the class after the constructor.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>// student.service.ts\n\nimport { Observable } from 'rxjs';\n\n public getStudents(): any {\n     const studentsObservable = new Observable(observer =&gt; {\n            setTimeout(() =&gt; {\n                observer.next(this.students);\n            }, 1000);\n     });\n\n     return studentsObservable;\n }\n</pre><p class=\'ql-align-justify\'>So, here we have done is first import the Observable from rxjs. Then defined one function that will return an observable. The observable object gets one argument that has a timeout function. So after 1 second, it will produce the whole student’s array if the subscriber subscribes the observable.</p><p class=\'ql-align-justify\'>In simple terms, here&nbsp;<strong>studentObservable</strong>&nbsp;are publishing our primary data array that is students. So if any entity needs to get the values out of observable, then it first needs to subscribe that observable and then&nbsp;<strong>studentObservable</strong>&nbsp;starts to publish the values, and then subscriber get the values.</p><h2><strong style=\'color: rgb(153, 51, 0);\'>Step 4: Define the Subscriber</strong></h2><p class=\'ql-align-justify\'>We have created the Publisher for the Observables. Now, we need to create a subscriber. So write the following code inside the&nbsp;<strong>app.component.ts&nbsp;</strong>file.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>// app.component.ts\n\nimport { Component, OnInit } from '@angular/core';\nimport { Student } from './student.model';\nimport { StudentService } from './student.service';\n\n@Component({\n  selector: 'app-root',\n  templateUrl: './app.component.html',\n  styleUrls: ['./app.component.css']\n})\nexport class AppComponent implements OnInit {\n\n    students: Student[] = [];\n\n    constructor(private studentservice: StudentService) {}\n\n    ngOnInit() {\n        const studentsObservable = this.studentservice.getStudents();\n        studentsObservable.subscribe((studentsData: Student[]) =&gt; {\n            this.students = studentsData;\n        });\n    }\n}\n</pre><p>Here, we have subscribed the observable and get the students data.</p><p>The final step is to display the data.</p><h2><strong style=\'color: rgb(153, 51, 0);\'>Step 5: Display the data</strong></h2><p>Add the following code inside the&nbsp;<strong>app.component.html&nbsp;</strong>file.</p><pre class=\'ql-syntax\' spellcheck=\'false\'>&lt;!-- app.component.html&gt;\n\n&lt;div class=\'container\'&gt;\n    &lt;div class=\'row\' style=\'margin-top: 30px\'&gt;\n        &lt;div class=\'col-md-3 col-xs-6\' *ngFor=\'let student of students\'&gt;\n            &lt;div class=\'card\'&gt;\n                &lt;div class=\'card-body\'&gt;\n                    &lt;h5 class=\'card-title\'&gt;{{ student.name }}&lt;/h5&gt;\n                    &lt;h6 class=\'card-subtitle\'&gt;{{ student.enrollmentnumber }}&lt;/h6&gt;\n                    &lt;p class=\'card-text\'&gt;{{ student.college }}&lt;/p&gt;\n                    &lt;p class=\'card-text\'&gt;{{ student.university }}&lt;/p&gt;\n                    &lt;a class=\'btn btn-primary\' href=\'#\' &gt;Go somewhere&lt;/a&gt;\n                &lt;/div&gt;\n            &lt;/div&gt;\n        &lt;/div&gt;\n    &lt;/div&gt;\n&lt;/div&gt;\n</pre><p>Save the file and start the angular development server.</p>`,
        created: '2019-07-01T22:44:33.720Z',
        modified: '2019-07-01T22:44:33.720Z',
        published: true
    },
    {
      slug: 'aut-voluptatum-accusantium',
      uid: 'quU47PyHKEZWJaklZeRpJeMKOGy1',
      topic: 'Configuration',
      title: 'Legacy Usability Associate',
      description: 'Ipsa error suscipit et.',
      image: 'http://lorempixel.com/640/480/people',
      // tslint:disable-next-line:max-line-length
      body: `Fugiat non fugiat. Sequi blanditiis eaque. Necessitatibus maxime non incidunt eum molestiae. Ipsa doloremque inventore eaque quisquam. Doloribus autem eum eos ab.`,
      created: '2019-01-09T14:12:50.342Z',
      modified: '2019-07-01T02:42:25.920Z',
      published: true
    },
    {
      slug: 'et-temporibus-et',
      uid: 'de95b002-86c2-47d4-8fbf-49bfbc0ba044',
      topic: 'Operations',
      title: 'Customer Paradigm Officer',
      description: 'Aspernatur explicabo doloremque iure blanditiis et est rerum.',
      image: 'http://lorempixel.com/640/480/fashion',
      // tslint:disable-next-line:max-line-length
      body: `Voluptatum et expedita asperiores voluptatem. Optio aut in quis repellat repellat exercitationem harum mollitia. Nobis harum omnis consequatur et.`,
      created: '2019-01-10T04:15:18.454Z',
      modified: '2019-06-30T21:00:17.635Z',
      published: true
    },
    {
      slug: 'alias-aut-aut',
      uid: '1d6bcdbf-0252-405b-b93f-87c3203ec9ea',
      topic: 'Security',
      title: 'Senior Integration Designer',
      description: 'Vero cupiditate adipisci soluta repudiandae asperiores impedit laudantium delectus repudiandae.',
      image: 'http://lorempixel.com/640/480/business',
      // tslint:disable-next-line:max-line-length
      body: `Quia ex delectus ut illum. Magni molestiae officiis reiciendis iure eum repellat consequuntur. Odit architecto ut occaecati incidunt itaque.`,
      created: '2018-09-13T22:58:49.358Z',
      modified: '2019-06-30T10:29:38.701Z',
      published: true
    },
    {
      slug: 'assumenda-quidem-sed',
      uid: '78a47db8-9b60-4d00-99fa-21bbd685ac28',
      topic: 'Response',
      title: 'Senior Communications Architect',
      description: 'Cum voluptas quisquam odio assumenda quisquam.',
      image: 'http://lorempixel.com/640/480/sports',
      // tslint:disable-next-line:max-line-length
      body: `Repellendus consequatur aspernatur animi nostrum est voluptatem. Et aliquam similique quod sunt maiores inventore. Architecto aspernatur est aliquid rem. Est eum minus aut culpa.`,
      created: '2019-01-10T01:40:09.984Z',
      modified: '2019-07-01T03:05:31.830Z',
      published: true
    },
    {
      slug: 'sit-dolorum-soluta',
      uid: 'quU47PyHKEZWJaklZeRpJeMKOGy1',
      topic: 'Creative',
      title: 'Dynamic Intranet Specialist',
      description: 'Delectus sint nostrum dolores repellendus.',
      image: 'http://lorempixel.com/640/480/technics',
      // tslint:disable-next-line:max-line-length
      body: `Eos eveniet qui. Qui reprehenderit quae qui similique. Veritatis illo debitis quam rerum maiores non ipsum. Dicta suscipit in eum et laudantium nulla repellendus ipsam quo. Rerum tenetur perferendis pariatur est accusamus repellat suscipit quisquam provident. Sit vero eum suscipit eaque ea tenetur.`,
      created: '2019-03-16T03:09:11.482Z',
      modified: '2019-06-30T22:13:28.988Z',
      published: true
    }
  ];
}

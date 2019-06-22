import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo/seo.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  constructor(
    private seoService: SeoService
  ) {
    this.seoService.generateTags({
      title: `Contact Us`,
      description: `Get in touch and we’ll get back to you as soon as we can.  We look forward to hearing from you!`
    });
  }

  ngOnInit() {
  }

}

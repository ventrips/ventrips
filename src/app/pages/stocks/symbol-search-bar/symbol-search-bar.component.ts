import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, Renderer2, NgZone, Input } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Observable, Subject, merge } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, tap, startWith } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-symbol-search-bar',
  templateUrl: './symbol-search-bar.component.html',
  styleUrls: ['./symbol-search-bar.component.scss']
})
export class SymbolSearchBarComponent implements OnInit {
  @Input() showHeader: boolean;
  @Input() symbol: string;
  @ViewChild('searchBar', {static: false}) searchInputText: ElementRef; // Remove aria-multiline to improve SEO
  public _ = _;
  public searchTerm: any;
  public searchOptions: Array<string> = ['AAPL', 'AMZN', 'FB', 'MSFT', 'SPY', 'SPXL', 'SPXS', 'TSLA', 'VIX', 'WTI'];

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    this.searchTerm = this.symbol;
  }

  ngAfterViewInit(): void {  // Remove aria-multiline to improve SEO
    if (this.searchInputText !== undefined ) {
        this.renderer.removeAttribute(this.searchInputText.nativeElement, 'aria-multiline');
    }
  }

  search = (text$: Observable<string>) => text$.pipe(
    debounceTime(0),
    distinctUntilChanged(),
    map(term => {
      this.searchTerm = _.replace(_.toUpper(term), new RegExp(/[^a-zA-Z0-9]/g), '');
      return term.length < 1 ? []
      : this.searchOptions.filter(v => v.toLowerCase().startsWith(term.toLocaleLowerCase())).splice(0, 10);
    })
  )

  isPlatformBrowser() {
    return isPlatformBrowser(this.platformId);
  }
}

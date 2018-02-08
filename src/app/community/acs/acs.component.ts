import {
  Component,
  OnInit
} from '@angular/core';

@Component({
  selector: 'app-acs',
  templateUrl: './acs.component.html',
  styleUrls: ['./acs.component.scss']
})
export class AcsComponent implements OnInit {
  constructor () {}

  public ngOnInit (): void {
    if ($(window).width() > 1025) {
      const $sticky = $('.sticky');
      $sticky.css({ position: 'fixed', top: '86px' });
    }
  }

  protected postLink (e): void {
    $('.create-poll, .brain-map, .ask-question, .share-story, .guest-list').hide();
    $('.create-post, .timeline-block').fadeIn();
    $('.post-action li').removeClass('active');
    $(e.target).closest('li').addClass('active');
  }

  protected pollLink (e): void {
    $('.create-post, .brain-map, .ask-question, .share-story, .guest-list').hide();
    $('.create-poll, .timeline-block').fadeIn();
    $('.post-action li').removeClass('active');
    $(e.target).closest('li').addClass('active');
  }
}

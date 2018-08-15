import {
  Component,
  Input,
  SimpleChanges
} from '@angular/core';
import {
  Router
} from '@angular/router';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig
} from '@angular/material';
import {
  Overlay
} from '@angular/cdk/overlay';
import {
  PostModel,
  UserModel,
  CampusPostModel,
  CampusCourseFeedPostModel,
  CampusClassPostModel
} from '../../models';
import {
  PostApiService,
  CampusApiService
} from '../../../../services/api';
import {
  PostEmitter
} from '../../emitter';
import {
  CryptoUtilities
} from '../../../shared/utilities';
import {
  UserService,
} from '../../../../services';
import {
  SharedImagePreviewComponent,
  SharedPostDetailModalComponent
} from '../../modals';

@Component({
  selector: 'shared-post-component',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class SharedPostComponent {
  constructor (
    private postApiService: PostApiService,
    private campusApiService: CampusApiService,
    private router: Router,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}

  @Input() protected posts: Array<PostModel|CampusPostModel|CampusCourseFeedPostModel|CampusClassPostModel> = [];
  @Input() protected route: {
    name: string,
    campusId?: number,
    campusFreshersFeedId?: number,
    campusCourseFeedId?: number,
    campusClassId?: number
  } = {name: 'home'};
  @Input() protected user: UserModel;
  protected btnLoadMoreText = 'Load More';
  protected notPostMessage: string;
  private dialogRef: MatDialogRef<SharedImagePreviewComponent>;
  private limit = 5;
  private offset = 0;
  private votePercentages: Array<string> = [];

  public ngOnInit (): void {
    this.getSharedPostSubscriber();
    this.postSavedSubcribers();
  }

  public ngOnChanges (changes: SimpleChanges): void {
    if (this.posts.length === 0 && changes.posts.previousValue) {
      this.notPostMessage = 'No Post Yet. Be the one to POST';
    }
  }

  private postSavedSubcribers (): void {
    PostEmitter.postSave()
      .subscribe((post: PostModel|CampusPostModel) => {
        this.posts.unshift(post);
      });
  }

  private getSharedPostSubscriber (): void {
    PostEmitter.postShare()
      .subscribe((post: PostModel|CampusPostModel) => {
        this.posts.unshift(post);
      });
  }

  protected onClickUserProfile (user): Promise<boolean> {
    let userId = CryptoUtilities.cipher(user.id);
    let currentLoginUser = UserService.getUser();

    if (user.id === currentLoginUser.id) {
      return this.router.navigate([`/profile`]);
    }

    return this.router.navigate([`/profile/${userId}`]);
  }

  protected onDeletePost (postId: number): void {
    // delete here the post
    this.postApiService.promiseRemovePost(postId)
      .then(() => {
        let index = this.posts.findIndex(filter => filter.id === postId);
        this.posts.splice(index, 1);
      })
      .catch(() => {});
  }

  protected onLoadMorePost (): void {
    this.offset = this.posts.length;
    let campusId: any;

    switch (this.route.name) {
      case 'home':
        this.postApiService.promiseGetAllPost(this.limit, this.offset)
          .then((posts: PostModel[]) => {
            this.posts = this.posts.concat(posts);
            this.checkIfThereAreStillPostAvailable(posts);
          });
        break;
      case 'campus':
        campusId = parseInt(CryptoUtilities.decipher(this.route.campusId), 10);
        this.campusApiService.promiseGetAllPost(campusId, this.limit, this.offset)
          .then((campusPost: CampusPostModel[]) => {
            this.posts = this.posts.concat(campusPost);
            this.checkIfThereAreStillPostAvailable(campusPost);
          });
        break;
      case 'campusFreshersFeed':
        campusId = parseInt(CryptoUtilities.decipher(this.route.campusId), 10);
        let campusFreshersFeedId = parseInt(CryptoUtilities.decipher(this.route.campusCourseFeedId), 10);
        this.campusApiService.promiseGetAllFreshersFeedPost(campusId, campusFreshersFeedId, this.limit, this.offset)
          .then((campusPost: CampusPostModel[]) => {
            this.posts = this.posts.concat(campusPost);
            this.checkIfThereAreStillPostAvailable(campusPost);
          });
        break;
      case 'campusCourseFeed':
        campusId = parseInt(CryptoUtilities.decipher(this.route.campusId), 10);
        let campusCourseFeedId = parseInt(CryptoUtilities.decipher(this.route.campusCourseFeedId), 10);
        this.campusApiService.promiseGetAllCoursePost(campusId, campusCourseFeedId)
          .then((campusPost: CampusPostModel[]) => {
            this.posts = this.posts.concat(campusPost);
            this.checkIfThereAreStillPostAvailable(campusPost);
          });
        break;
      case 'campusClasses':
        campusId = parseInt(CryptoUtilities.decipher(this.route.campusId), 10);
        let campusClassId = parseInt(CryptoUtilities.decipher(this.route.campusClassId), 10);
        this.campusApiService.promiseGetAllClassPost(campusId, campusClassId, true, this.limit, this.offset)
          .then((campusPost: CampusPostModel[]) => {
            this.posts = this.posts.concat(campusPost);
            this.checkIfThereAreStillPostAvailable(campusPost);
          });
        break;
    }
  }

  protected onClickPhoto (postAttachments, imageIndex): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.panelClass = 'image-preview-modal';
    dialogConfig.disableClose = true;
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.block();
    dialogConfig.data = { images: postAttachments, clickIndex: imageIndex, source: 'post' };
    this.dialogRef = this.dialog.open(SharedImagePreviewComponent, dialogConfig);
  }

  protected getPollExpiryDuration (createdDate, duration): any {
    let date = new Date(createdDate);
    let expiryDate = date.setDate(date.getDate() + duration);
    let dateNow: any = new Date();

    let seconds = Math.floor((expiryDate - (dateNow)) / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    minutes = minutes - (days * 24 * 60) - ((hours - (days * 24)) * 60);

    let hoursLeft = null;
    let minutesLeft = null;

    if (hours !== 0) {
      if (hours > 1) {
        hoursLeft = hours + ' hours ';
      } else if (hours === 1) {
        hoursLeft = hours + ' hour ';
      }
    }

    if (minutes !== 0) {
      if (minutes > 1) {
        minutesLeft = minutes + ' minutes left ';
      } else if (hours === 1) {
        minutesLeft = minutes + ' minute left ';
      }
    }

    let separator = (hoursLeft && minutesLeft ? 'and ' : '');

    return (hoursLeft ? hoursLeft : '') + separator + (minutesLeft ? minutesLeft : 'left');
  }

  protected getPollVoteCount (pollOptions): number {
    let total = 0;
    for ( let i = 0; i < pollOptions.length; i++ ) {
     total += pollOptions[i].count;
    }

    return total;
  }

  protected onPollVote (pollIndex, option, pollOptions): void {
    switch (this.route.name) {
      case 'home':
        this.postApiService.promiseVotePoll(option.id)
          .then(() => {
            pollOptions[pollIndex].count += 1;
            this.getPollVoteCount(pollOptions);
            this.getPollPercentage(option, pollOptions);
          })
          .catch(() => {});
        break;
      case 'campus':
      case 'campusFreshersFeed':
      case 'campusCourseFeed':
      case 'campusClasses':
        this.campusApiService.promiseVotePoll(option.id)
          .then(() => {})
          .catch(() => {});
        break;
    }
  }

  protected getPollPercentage (option, pollOptions): string {
    // assign a default value for count if there is non
    // meaning this object comes upon clicking add post
    if (!option.count) { option.count = 0; }
    let totalVotes = this.getPollVoteCount(pollOptions);
    let percentage = option.count === 0 ? 0 : ((option.count) / totalVotes) * 100;
    let percent = percentage.toFixed(1);

    this.votePercentages.push(percent);

    console.log(this.votePercentages);

    return percent;
  }

  private checkIfThereAreStillPostAvailable (posts: PostModel[]|CampusPostModel[]): void {
    if (posts.length === 0) {
      this.btnLoadMoreText = 'No More Posts To Show';
    }
  }

  protected trimStory (message, maxCharacters): string {
    let trimmedString = message.substr(0, maxCharacters);
    return trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(' '))) + '...';
  }

  protected onClickCommentDetail (post): void {
    let dialogConfig = new MatDialogConfig();

    dialogConfig.panelClass = 'post-comment-detail-modal';
    dialogConfig.disableClose = true;
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.block();
    dialogConfig.data = {post: post, route: this.route, user: this.user};
    this.dialog.open(SharedPostDetailModalComponent, dialogConfig);
  }

  public ngOnDestroy (): void {
    PostEmitter.removeSubscriber(PostEmitter.getPostSaveName());
    PostEmitter.removeSubscriber(PostEmitter.getPostSaveName());
  }
}

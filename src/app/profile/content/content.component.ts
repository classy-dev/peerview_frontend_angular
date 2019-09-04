import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import {
  UserApiService
} from '../../../services/api';
import {
  UserService
} from '../../../services';
import {
  PostModel,
  UserModel
} from '../../shared/models';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { Overlay } from '@angular/cdk/overlay';
import { ProfileAddExperienceDialogComponent } from './add-experience-modal/add-experience-modal.component';
import { ProfileAddSkillsDialogComponent } from './add-skills-modal/add-skills-modal.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'profile-content-component',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ProfileContentComponent implements OnInit {
  constructor (
    private route: ActivatedRoute,
    private userApiService: UserApiService,
    private dialog: MatDialog,
    private overlay: Overlay
  ) {}

  @Input() protected user: UserModel;
  protected posts: PostModel[] = [];
  protected workExperiences: any[] = [];
  protected isUserProfile: boolean = true;
  private routeSubscriber: any;

  public ngOnInit (): void {
    // this.getUserTimeline();
    this.getWorkExperience();
    let currentLoginUser = UserService.getUser();

    if (currentLoginUser.id !== this.user.id) {
      this.isUserProfile = false;
    } else {
      this.isUserProfile = true;
    }

    this.routeSubscriber = this.route
      .queryParams
      .subscribe(params => {
        if (params.mt) {
          switch (params.mt) {
            case '1':
              this.openAddExperienceDialog();
              break;
            case '2':
              this.openAddSkillsDialog();
              break;
            default:
              break;
          }
        }
      });
  }

  protected onShowPostDetailDialogComponent (): void {}

  // private getUserTimeline (): void {
  //   this.userApiService.promiseGetTimeline(this.user.id, 10, 0)
  //     .then((posts: PostModel[]) => {
  //       this.posts = posts;
  //     })
  //     .catch(error => {});
  // }

  private getWorkExperience (): void {
    this.userApiService.promiseGetWorkExperience(this.user.id)
      .then((workExperiences: any[]) => {
        this.workExperiences = workExperiences;
      })
      .catch(error => {});
  }

  private openAddExperienceDialog (): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.panelClass = 'add-experience-modal';
    dialogConfig.id = 'ProfileAddExperienceDialogComponent';
    dialogConfig.disableClose = true;
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.block();
    dialogConfig.data = {
      image: 'test',
      source: 'profile-picture'
    };
    this.dialog.open(ProfileAddExperienceDialogComponent, dialogConfig);
  }

  private openAddSkillsDialog (): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.panelClass = 'add-skills-modal';
    dialogConfig.id = 'ProfileAddSkillsDialogComponent';
    dialogConfig.disableClose = true;
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.block();
    dialogConfig.data = {
      image: 'test',
      source: 'profile-picture'
    };
    this.dialog.open(ProfileAddSkillsDialogComponent, dialogConfig);
  }
}


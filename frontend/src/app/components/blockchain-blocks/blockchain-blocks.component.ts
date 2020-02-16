import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Block } from 'src/app/interfaces/electrs.interface';
import { StateService } from 'src/app/services/state.service';

@Component({
  selector: 'app-blockchain-blocks',
  templateUrl: './blockchain-blocks.component.html',
  styleUrls: ['./blockchain-blocks.component.scss']
})
export class BlockchainBlocksComponent implements OnInit, OnDestroy {
  blocks: Block[] = [];
  blocksSubscription: Subscription;
  interval: any;
  trigger = 0;

  constructor(
    private stateService: StateService,
  ) { }

  ngOnInit() {
    this.blocksSubscription = this.stateService.blocks$
      .subscribe((block) => {
        if (this.blocks.some((b) => b.height === block.height)) {
          return;
        }
        this.blocks.unshift(block);
        this.blocks = this.blocks.slice(0, 8);
      });

    this.interval = setInterval(() => this.trigger++, 10 * 1000);
  }

  ngOnDestroy() {
    this.blocksSubscription.unsubscribe();
    clearInterval(this.interval);
  }

  trackByBlocksFn(index: number, item: Block) {
    return item.height;
  }

  getStyleForBlock(block: Block) {
    const greenBackgroundHeight = 100 - (block.weight / 4000000) * 100;
    if (window.innerWidth <= 768) {
      return {
        top: 155 * this.blocks.indexOf(block) + 'px',
        background: `repeating-linear-gradient(#2d3348, #2d3348 ${greenBackgroundHeight}%,
          #9339f4 ${Math.max(greenBackgroundHeight, 0)}%, #105fb0 100%)`,
      };
    } else {
      return {
        left: 155 * this.blocks.indexOf(block) + 'px',
        background: `repeating-linear-gradient(#2d3348, #2d3348 ${greenBackgroundHeight}%,
          #9339f4 ${Math.max(greenBackgroundHeight, 0)}%, #105fb0 100%)`,
      };
    }
  }

}

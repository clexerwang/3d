import React from 'react';
import { Input, Button, message } from 'antd';

class SearchGoods extends React.Component {



    handleClick = () => {
        message.error('未搜索到对应物资');
    };

    render() {
        return (
            <div className='search-goods'>
                <Input
                    placeholder={'请输入货物信息'}
                    style={{ width: '50%', marginRight: '20px' }}
                    />
                <Button onClick={this.handleClick} type={'primary'}>
                    搜索
                </Button>
            </div>
        )
    }
}

export default SearchGoods

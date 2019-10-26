import React from 'react';
import { Table } from 'antd';
import moment from 'moment';

const columns=[{
    title: '物资类型',
    dataIndex: 'type'
},{
    title: '物资所在货架',
    dataIndex: 'shelfLocation',
    sorter: (a, b) => a-b
}, {
    title: '物资所在货位',
    dataIndex: 'siteLocation',
    sorter: (a, b) => a - b
}, {
    title: '物资入库时间',
    dataIndex: 'entryDate',
    render: (date) => moment(date).format('YYYY-MM-DD HH:MM:SS'),
    sorter: (a, b) => a - b
}, {
    title: '物资在库时间',
    dataIndex: 'stayTime',
    sorter: (a, b) => a - b
}, {
    title: 'ID',
    dataIndex: 'id'
}, {
    title: '体积类型',
    dataIndex: 'size'
}

];
const dataSource = [
    {
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '大'
    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '大'

    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '大'
    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '大'
    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '小'
    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '小'
    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '大'
    },{
        type: '变压器',
        shelfLocation: 2,
        siteLocation: 12,
        entryDate: 1571478727068,
        stayTime: 0,
        id: 1029312323,
        size: '小'
    }
]
class GoodsList extends React.Component {


    render() {
        return (
            <div className='goods-list'>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                />
            </div>
        )
    }
}

export default GoodsList;